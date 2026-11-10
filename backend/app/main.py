from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.predict import router as predict_router, get_engine
from app.api.metrics import router as metrics_router
from app.api.hotspots import router as hotspots_router
from app.api.simulate import router as simulate_router

app = FastAPI(
    title="SEVERA: Road Accident Severity Early-Warning API",
    description="Mission-critical ML inference API for road accident severity prediction, SHAP-driven explanations, risk scoring, and real-time emergency dispatch telemetry.",
    version="1.0.0"
)

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(predict_router)
app.include_router(metrics_router)
app.include_router(hotspots_router)
app.include_router(simulate_router)


@app.on_event("startup")
async def startup_event():
    print("SEVERA API starting up...")
    try:
        # Pre-warm model in memory
        get_engine()
        print("SEVERA Inference Engine pre-warmed successfully.")
    except Exception as e:
        print(f"Startup warning: {e}")


@app.get("/", tags=["Health"])
async def root():
    return {
        "system": "SEVERA Emergency Warning Platform",
        "status": "OPERATIONAL",
        "endpoints": [
            "POST /predict",
            "GET /metrics",
            "GET /hotspots",
            "GET /simulate/stream",
            "WS /ws/simulate",
            "GET /docs"
        ]
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "HEALTHY", "model_loaded": True}
