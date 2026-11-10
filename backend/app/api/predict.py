from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import AccidentPredictionInput, PredictionResponse
from app.core.inference import SeveraInferenceEngine
from app.core.paths import artifact_path

router = APIRouter(prefix="", tags=["Prediction"])

_engine: SeveraInferenceEngine = None

def get_engine():
    global _engine
    if _engine is None:
        model_path = artifact_path("severa_best_model.joblib")
        _engine = SeveraInferenceEngine(model_path)
    return _engine


@router.post("/predict", response_model=PredictionResponse)
async def predict_accident_severity(payload: AccidentPredictionInput, engine: SeveraInferenceEngine = Depends(get_engine)):
    """Predict road accident severity (Slight, Serious, Fatal), probabilities,
    calibrated risk index (0-100), emergency dispatch trigger, and top 5 explanatory reasons.
    """
    try:
        response = engine.predict(payload)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
