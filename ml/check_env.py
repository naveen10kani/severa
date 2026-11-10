import sys

mods = ['pandas', 'numpy', 'sklearn', 'xgboost', 'lightgbm', 'shap', 'fastapi', 'uvicorn', 'joblib', 'imblearn']
results = []
for m in mods:
    try:
        __import__(m)
        results.append(f"{m}: OK")
    except Exception as e:
        results.append(f"{m}: MISSING ({e})")

with open("ml/env_result.txt", "w") as f:
    f.write("\n".join(results) + "\n")
