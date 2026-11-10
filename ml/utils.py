# utils.py – Helper functions for the SEVERA ML pipeline
"""Utilities for data loading, cleaning, feature engineering, and model helpers.
The module is deliberately self‑contained – it does not depend on any external
project configuration so it can be imported from both the notebook and the CLI
script (`train.py`).

Key functions:
- `load_dataset(csv_path)` – reads CSV into a pandas DataFrame.
- `clean_data(df)` – handles missing values and basic type conversion.
- `engineer_features(df)` – creates time‑derived columns and binary flags.
- `prepare_for_training(df, target_col='severity')` – encodes categoricals,
  returns X, y and the fitted encoders.
- `inverse_transform_target(encoded, le)` – map encoded labels back to names.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import OneHotEncoder, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline


def load_dataset(csv_path: str) -> pd.DataFrame:
    """Load the CSV dataset.

    Parameters
    ----------
    csv_path: str
        Path to the CSV file.

    Returns
    -------
    pd.DataFrame
        Raw data as read from disk.
    """
    return pd.read_csv(csv_path)


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Basic cleaning – fill or drop obvious missing values.

    * Numeric columns: fill missing with median.
    * Categorical columns: fill missing with a placeholder "unknown".
    """
    df = df.copy()
    # Define expected columns – defensive if extra columns exist.
    numeric_cols = [c for c in df.select_dtypes(include=[np.number]).columns]
    categorical_cols = [c for c in df.select_dtypes(exclude=[np.number]).columns]
    for col in numeric_cols:
        median = df[col].median()
        df[col].fillna(median, inplace=True)
    for col in categorical_cols:
        df[col].fillna('unknown', inplace=True)
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create engineered features used by the models.

    Features added:
    * `hour` – extracted from `time_of_day` (0‑23).
    * `is_weekend` – boolean from `day_of_week`.
    * `is_rush_hour` – hour in [7‑9, 16‑18].
    * `is_night` – hour >= 20 or < 5.
    * `wet_high_speed` – (weather in ['rain', 'snow']) & speed_limit > 60.
    """
    df = df.copy()
    # Assume `time_of_day` is a string like "HH:MM" or an integer hour.
    if 'time_of_day' in df.columns:
        # Try to coerce to hour integer
        def to_hour(val):
            try:
                if isinstance(val, str) and ':' in val:
                    return int(val.split(':')[0])
                return int(val)
            except Exception:
                return np.nan
        df['hour'] = df['time_of_day'].apply(to_hour)
    else:
        df['hour'] = np.nan
    # Day of week – expect string name or integer 0‑6
    if 'day_of_week' in df.columns:
        df['is_weekend'] = df['day_of_week'].isin(['Saturday', 'Sunday', 5, 6])
    else:
        df['is_weekend'] = False
    df['is_rush_hour'] = df['hour'].isin([7, 8, 9, 16, 17, 18])
    df['is_night'] = df['hour'].apply(lambda h: h >= 20 or (h < 5 if pd.notnull(h) else False))
    # Wet & high speed flag
    wet_conditions = {'rain', 'snow', 'storm'}
    df['wet_high_speed'] = df.apply(
        lambda row: (row.get('weather') in wet_conditions) and (row.get('speed_limit', 0) > 60),
        axis=1,
    )
    return df


def prepare_for_training(
    df: pd.DataFrame,
    target_col: str = 'severity',
):
    """Encode features and target for ML models.

    Returns
    -------
    X : np.ndarray
        Feature matrix.
    y : np.ndarray
        Encoded target.
    encoder : ColumnTransformer
        Fitted transformer for later inference.
    label_encoder : LabelEncoder
        Mapping from severity strings to integers.
    """
    df = df.copy()
    # Separate target
    y_raw = df[target_col]
    X = df.drop(columns=[target_col])
    # Identify categorical vs numeric columns after engineering
    categorical_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()
    numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    # One‑hot encode categoricals (drop='first' to avoid collinearity)
    categorical_transformer = OneHotEncoder(handle_unknown='ignore', sparse=False, drop='first')
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', categorical_transformer, categorical_cols),
            ('num', 'passthrough', numeric_cols),
        ]
    )
    X_encoded = preprocessor.fit_transform(X)
    # Encode target labels
    le = LabelEncoder()
    y = le.fit_transform(y_raw)
    return X_encoded, y, preprocessor, le


def inverse_transform_target(encoded: int, le: LabelEncoder) -> str:
    """Map integer label back to severity string (e.g., 2 → 'Fatal')."""
    return le.inverse_transform([encoded])[0]

# The module can be executed directly for a quick sanity check
if __name__ == '__main__':
    print('utils loaded – no runtime action')
