"""train.py - Full ML Training Pipeline for SEVERA
Trains and compares Logistic Regression, Random Forest, XGBoost, and LightGBM.
Handles class imbalance via class weighting and SMOTE.
Evaluates Precision, Recall, F1, Accuracy, ROC-AUC, and Confusion Matrix.
Optimizes specifically for RECALL on the Fatal class.
Computes SHAP feature importance and saves the best model + artifacts.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    roc_auc_score
)
import xgboost as xgb
import lightgbm as lgb
from imblearn.over_sampling import SMOTE
import shap


def load_and_preprocess(csv_path: str):
    print(f"Loading data from {csv_path}...")
    df = pd.read_csv(csv_path)

    # Time-based feature engineering
    if 'date' in df.columns and 'time_of_day' in df.columns:
        df['datetime_str'] = df['date'] + ' ' + df['time_of_day']
        df['datetime'] = pd.to_datetime(df['datetime_str'], format='%Y-%m-%d %H:%M', errors='coerce')
        df = df.sort_values('datetime').reset_index(drop=True)
        df['hour'] = df['datetime'].dt.hour
    else:
        df['hour'] = 12

    # Feature engineering
    df['is_weekend'] = df['day_of_week'].isin(['Saturday', 'Sunday']).astype(int)
    df['is_rush_hour'] = df['hour'].isin([7, 8, 9, 16, 17, 18]).astype(int)
    df['is_night'] = ((df['hour'] >= 20) | (df['hour'] < 5)).astype(int)
    wet_weather = ['rain', 'snow', 'storm']
    df['wet_and_high_speed'] = ((df['weather'].isin(wet_weather)) & (df['speed_limit'] >= 70)).astype(int)

    # Clean missing values
    num_cols = ['speed_limit', 'vehicle_count', 'latitude', 'longitude', 'hour']
    for c in num_cols:
        if c in df.columns:
            df[c] = df[c].fillna(df[c].median())

    cat_cols = ['weather', 'road_type', 'light_condition', 'day_of_week']
    for c in cat_cols:
        if c in df.columns:
            df[c] = df[c].fillna('unknown')

    feature_cols = [
        'weather', 'road_type', 'light_condition', 'day_of_week',
        'speed_limit', 'vehicle_count', 'latitude', 'longitude',
        'hour', 'is_weekend', 'is_rush_hour', 'is_night', 'wet_and_high_speed'
    ]

    target_col = 'severity'
    X = df[feature_cols].copy()
    y_raw = df[target_col].copy()

    # Encode target: Slight -> 0, Serious -> 1, Fatal -> 2
    label_mapping = {'Slight': 0, 'Serious': 1, 'Fatal': 2}
    y = y_raw.map(label_mapping).values

    # Preprocessing pipeline
    categorical_features = ['weather', 'road_type', 'light_condition', 'day_of_week']
    numeric_features = [
        'speed_limit', 'vehicle_count', 'latitude', 'longitude',
        'hour', 'is_weekend', 'is_rush_hour', 'is_night', 'wet_and_high_speed'
    ]

    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore'), categorical_features),
            ('num', StandardScaler(), numeric_features)
        ]
    )

    # Temporal split: 80% train, 20% test (preserving time sequence)
    split_idx = int(len(df) * 0.8)
    X_train_raw, X_test_raw = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]

    print("Fitting preprocessor on training data...")
    X_train = preprocessor.fit_transform(X_train_raw)
    X_test = preprocessor.transform(X_test_raw)

    # Get one-hot feature names
    cat_encoder = preprocessor.named_transformers_['cat']
    cat_names = list(cat_encoder.get_feature_names_out(categorical_features))
    feature_names = cat_names + numeric_features

    return (X_train, X_test, y_train, y_test, preprocessor, feature_names, X_train_raw, X_test_raw, df)


def train_and_evaluate():
    data_path = "C:/Users/Naveen/OneDrive/Desktop/major project/ml/data/synthetic_accidents.csv"
    (X_train, X_test, y_train, y_test, preprocessor, feature_names, X_train_raw, X_test_raw, full_df) = load_and_preprocess(data_path)

    unique, counts = np.unique(y_train, return_counts=True)
    class_dist = dict(zip(['Slight', 'Serious', 'Fatal'], [int(c) for c in counts]))
    print(f"Training class distribution: {class_dist}")

    # SMOTE for handling class imbalance
    print("Applying SMOTE on training set...")
    smote = SMOTE(random_state=42)
    X_train_res, y_train_res = smote.fit_resample(X_train, y_train)

    # Balanced class weights with targeted recall boost for Fatal
    class_weights_rf = {0: 1.0, 1: 2.2, 2: 5.0}

    models = {
        'Random Forest (Recall-Tuned)': RandomForestClassifier(
            n_estimators=160,
            max_depth=12,
            class_weight=class_weights_rf,
            random_state=42,
            n_jobs=-1
        ),
        'XGBoost (SMOTE)': xgb.XGBClassifier(
            n_estimators=150,
            max_depth=6,
            learning_rate=0.08,
            objective='multi:softprob',
            num_class=3,
            random_state=42,
            n_jobs=-1
        ),
        'LightGBM': lgb.LGBMClassifier(
            n_estimators=150,
            max_depth=7,
            learning_rate=0.07,
            class_weight='balanced',
            random_state=42,
            n_jobs=-1,
            verbose=-1
        ),
        'Logistic Regression': LogisticRegression(
            max_iter=1000,
            class_weight='balanced',
            random_state=42
        )
    }

    metrics_comparison = {}
    best_score = -1.0
    best_model_name = None
    best_model = None

    for name, model in models.items():
        print(f"\nTraining {name}...")
        if 'SMOTE' in name:
            model.fit(X_train_res, y_train_res)
        else:
            model.fit(X_train, y_train)

        preds = model.predict(X_test)
        probs = model.predict_proba(X_test)

        acc = float(accuracy_score(y_test, preds))
        prec, rec, f1, _ = precision_recall_fscore_support(y_test, preds, average=None, labels=[0, 1, 2], zero_division=0)
        macro_f1 = float(np.mean(f1))
        cm = confusion_matrix(y_test, preds).tolist()

        try:
            auc = float(roc_auc_score(y_test, probs, multi_class='ovr'))
        except Exception:
            auc = 0.0

        fatal_recall = float(rec[2])
        fatal_precision = float(prec[2])
        serious_recall = float(rec[1])
        slight_recall = float(rec[0])

        metrics_comparison[name] = {
            'accuracy': round(acc, 4),
            'macro_f1': round(macro_f1, 4),
            'roc_auc': round(auc, 4),
            'confusion_matrix': cm,
            'per_class': {
                'Slight': {'precision': round(float(prec[0]), 4), 'recall': round(slight_recall, 4), 'f1': round(float(f1[0]), 4)},
                'Serious': {'precision': round(float(prec[1]), 4), 'recall': round(serious_recall, 4), 'f1': round(float(f1[1]), 4)},
                'Fatal': {'precision': round(fatal_precision, 4), 'recall': round(fatal_recall, 4), 'f1': round(float(f1[2]), 4)}
            },
            'fatal_recall': round(fatal_recall, 4),
            'fatal_f1': round(float(f1[2]), 4)
        }

        print(f"[{name}] Acc: {acc:.4f} | Fatal Recall: {fatal_recall:.4f} | Fatal Prec: {fatal_precision:.4f} | Macro F1: {macro_f1:.4f} | AUC: {auc:.4f}")

        # Optimization score: prioritize Fatal Recall (70% weight) combined with Macro F1 (30% weight)
        opt_score = 0.70 * fatal_recall + 0.30 * macro_f1
        if opt_score > best_score:
            best_score = opt_score
            best_model_name = name
            best_model = model

    print(f"\n>>> Selected Best Model: {best_model_name} (Composite Safety-Recall Score: {best_score:.4f})")

    # Compute SHAP feature importance
    print("\nComputing SHAP feature importance for interpretability...")
    shap_importance = {}
    try:
        sample_subset = X_test[:200]
        explainer = shap.TreeExplainer(best_model)
        shap_values = explainer.shap_values(sample_subset)
        if isinstance(shap_values, list):
            fatal_shap = np.abs(shap_values[2]).mean(axis=0)
        elif len(shap_values.shape) == 3:
            fatal_shap = np.abs(shap_values[:, :, 2]).mean(axis=0)
        else:
            fatal_shap = np.abs(shap_values).mean(axis=0)

        top_indices = np.argsort(fatal_shap)[::-1]
        for idx in top_indices:
            feat_name = feature_names[idx]
            shap_importance[feat_name] = round(float(fatal_shap[idx]), 5)
    except Exception as e:
        print(f"TreeExplainer note: {e}, falling back to model feature importances")
        if hasattr(best_model, 'feature_importances_'):
            imps = best_model.feature_importances_
            top_indices = np.argsort(imps)[::-1]
            for idx in top_indices:
                shap_importance[feature_names[idx]] = round(float(imps[idx]), 5)

    # Save artifacts for Backend
    backend_model_dir = "C:/Users/Naveen/OneDrive/Desktop/major project/backend/app/models_artifact"
    os.makedirs(backend_model_dir, exist_ok=True)
    os.makedirs("C:/Users/Naveen/OneDrive/Desktop/major project/ml/artifacts", exist_ok=True)

    artifact_bundle = {
        'model': best_model,
        'model_name': best_model_name,
        'preprocessor': preprocessor,
        'feature_names': feature_names,
        'class_names': ['Slight', 'Serious', 'Fatal'],
        'shap_importance': shap_importance,
        'training_timestamp': datetime.now(timezone.utc).isoformat()
    }

    joblib.dump(artifact_bundle, os.path.join(backend_model_dir, "severa_best_model.joblib"))
    joblib.dump(artifact_bundle, "C:/Users/Naveen/OneDrive/Desktop/major project/ml/artifacts/severa_best_model.joblib")
    print(f"Serialized best model to {backend_model_dir}/severa_best_model.joblib")

    # Generate hotspots data
    print("Generating accident hotspots data...")
    df_geo = full_df.copy()
    df_geo['lat_grid'] = df_geo['latitude'].round(2)
    df_geo['lon_grid'] = df_geo['longitude'].round(2)

    hotspots = []
    grouped = df_geo.groupby(['lat_grid', 'lon_grid'])
    for (lat, lon), group in grouped:
        if len(group) >= 12:
            counts = group['severity'].value_counts().to_dict()
            slight_cnt = counts.get('Slight', 0)
            serious_cnt = counts.get('Serious', 0)
            fatal_cnt = counts.get('Fatal', 0)
            total = len(group)
            risk_score = round((slight_cnt * 12 + serious_cnt * 48 + fatal_cnt * 100) / total, 1)
            hotspots.append({
                'latitude': float(lat),
                'longitude': float(lon),
                'total_accidents': int(total),
                'fatal_count': int(fatal_cnt),
                'serious_count': int(serious_cnt),
                'slight_count': int(slight_cnt),
                'risk_score': min(100.0, float(risk_score)),
                'primary_road_type': str(group['road_type'].mode()[0]),
                'common_weather': str(group['weather'].mode()[0])
            })

    hotspots.sort(key=lambda h: h['risk_score'], reverse=True)
    hotspots = hotspots[:150]

    metrics_payload = {
        'best_model': best_model_name,
        'models': metrics_comparison,
        'shap_importance': dict(list(shap_importance.items())[:15]),
        'feature_names': feature_names,
        'class_distribution': class_dist,
        'explanation_rationale': (
            "In emergency road accident response, optimizing for RECALL on Fatal accidents is paramount: "
            "a false negative (failing to identify a potentially fatal accident) results in catastrophic response delays, "
            "whereas a false positive (elevating a serious accident to fatal dispatch) only mobilizes precautionary emergency units."
        ),
        'evaluated_at': datetime.now(timezone.utc).isoformat()
    }

    with open("C:/Users/Naveen/OneDrive/Desktop/major project/backend/app/models_artifact/metrics.json", "w") as f:
        json.dump(metrics_payload, f, indent=2)

    with open("C:/Users/Naveen/OneDrive/Desktop/major project/backend/app/models_artifact/hotspots.json", "w") as f:
        json.dump(hotspots, f, indent=2)

    with open("C:/Users/Naveen/OneDrive/Desktop/major project/ml/metrics.json", "w") as f:
        json.dump(metrics_payload, f, indent=2)

    print("Saved metrics.json and hotspots.json successfully!")
    print("\n--- Training Complete ---")


if __name__ == '__main__':
    train_and_evaluate()
