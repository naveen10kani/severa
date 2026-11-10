"""
Build backend/app/models_artifact/hotspots.json from the synthetic STATS19 dataset.

Why this script exists:
    ml/train.py clusters accidents on a 0.01 degree grid (~1.1 km) and only keeps
    cells with >= 12 accidents. The synthetic dataset is spread across the whole
    UK bbox, so that grid never fills and the artefact ends up as an empty list,
    which renders the tactical heatmap blank.

This builder uses a coarser 0.08 degree cell (~8 km, comparable to an urban
corridor), keeps every reasonably busy cell, and tops the list up with the
busiest remaining cells so the map shows all three risk bands (low / medium /
high) defined in the frontend legend.
"""

import json
import os
import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
CSV_PATH = os.path.join(HERE, "synthetic_accidents.csv")
OUT_PATH = os.path.join(PROJECT_ROOT, "backend", "app", "models_artifact", "hotspots.json")

GRID = 0.08          # degrees (~8 km cells)
MIN_ACCIDENTS = 8    # minimum accidents before a cell is considered a cluster
MAX_HOTSPOTS = 160

# Projection bbox used by the frontend (LiveHotspotMap.project)
LAT_MIN, LAT_MAX = 50.0, 58.5
LON_MIN, LON_MAX = -8.0, 2.0


def risk_score(slight: int, serious: int, fatal: int, total: int) -> float:
    # Same weighting as ml/train.py: fatal outcomes dominate the index
    raw = (slight * 12 + serious * 48 + fatal * 100) / max(total, 1)
    return round(min(100.0, raw), 1)


def main() -> None:
    df = pd.read_csv(CSV_PATH)
    df["lat_cell"] = np.floor(df["latitude"] / GRID).astype(int)
    df["lon_cell"] = np.floor(df["longitude"] / GRID).astype(int)

    hotspots = []
    for (lat_cell, lon_cell), group in df.groupby(["lat_cell", "lon_cell"]):
        if len(group) < MIN_ACCIDENTS:
            continue
        counts = group["severity"].value_counts().to_dict()
        slight = int(counts.get("Slight", 0))
        serious = int(counts.get("Serious", 0))
        fatal = int(counts.get("Fatal", 0))
        total = int(len(group))

        lat = float(np.clip(group["latitude"].mean(), LAT_MIN + 0.05, LAT_MAX - 0.05))
        lon = float(np.clip(group["longitude"].mean(), LON_MIN + 0.05, LON_MAX - 0.05))

        hotspots.append(
            {
                "latitude": round(lat, 4),
                "longitude": round(lon, 4),
                "total_accidents": total,
                "fatal_count": fatal,
                "serious_count": serious,
                "slight_count": slight,
                "risk_score": risk_score(slight, serious, fatal, total),
                "primary_road_type": str(group["road_type"].mode().iloc[0]),
                "common_weather": str(group["weather"].mode().iloc[0]),
            }
        )

    # Band A: every elevated-risk cluster (risk >= 40)
    band_a = [h for h in hotspots if h["risk_score"] >= 40]
    # Band B: the busiest remaining cells so nominal clusters stay represented
    band_b = sorted(
        (h for h in hotspots if h["risk_score"] < 40),
        key=lambda h: h["total_accidents"],
        reverse=True,
    )

    selected = sorted(band_a + band_b, key=lambda h: h["risk_score"], reverse=True)[:MAX_HOTSPOTS]
    selected.sort(key=lambda h: h["risk_score"], reverse=True)

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(selected, f, indent=2)

    high = sum(1 for h in selected if h["risk_score"] >= 60)
    mid = sum(1 for h in selected if 40 <= h["risk_score"] < 60)
    low = len(selected) - high - mid
    print(f"Saved {len(selected)} hotspots -> {OUT_PATH}")
    print(f"  high (>=60): {high} | medium (40-59): {mid} | low (<40): {low}")


if __name__ == "__main__":
    main()
