import os
import json
from fastapi import APIRouter, HTTPException
from app.core.paths import artifact_path

router = APIRouter(prefix="", tags=["Metrics"])

METRICS_FILE = artifact_path("metrics.json")

@router.get("/metrics")
async def get_model_metrics():
    """Retrieve multi-model evaluation metrics (accuracy, macro F1, ROC-AUC, confusion matrices,
    per-class precision/recall/F1 with Fatal Recall highlighted, and global SHAP feature importance).
    """
    if not os.path.exists(METRICS_FILE):
        raise HTTPException(status_code=404, detail="Metrics file not generated yet. Run ML train pipeline first.")
    try:
        with open(METRICS_FILE, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading metrics: {str(e)}")
