import os
import json
from typing import List
from fastapi import APIRouter, HTTPException
from app.models.schemas import HotspotItem
from app.core.paths import artifact_path

router = APIRouter(prefix="", tags=["Hotspots"])

HOTSPOTS_FILE = artifact_path("hotspots.json")

@router.get("/hotspots", response_model=List[HotspotItem])
async def get_accident_hotspots():
    """Retrieve historical high-risk geographical accident hotspots with severity counts,
    road classifications, and risk density scores for dark heatmap visualization.
    """
    if not os.path.exists(HOTSPOTS_FILE):
        raise HTTPException(status_code=404, detail="Hotspots dataset not generated yet.")
    try:
        with open(HOTSPOTS_FILE, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading hotspots: {str(e)}")
