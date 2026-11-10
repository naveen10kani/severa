import asyncio
import json
import random
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from app.models.schemas import AccidentPredictionInput, WeatherEnum, RoadTypeEnum, LightConditionEnum
from app.api.predict import get_engine

router = APIRouter(prefix="", tags=["Simulation"])

UK_CITIES = [
    {"name": "London - M25 Orbital", "lat": 51.5387, "lon": -0.0988, "road": "motorway", "speed": 110},
    {"name": "Manchester - A57(M)", "lat": 53.4735, "lon": -2.2410, "road": "primary", "speed": 80},
    {"name": "Birmingham - Spaghetti Junction", "lat": 52.5085, "lon": -1.8643, "road": "motorway", "speed": 100},
    {"name": "Leeds - Inner Ring Road", "lat": 53.8008, "lon": -1.5491, "road": "primary", "speed": 60},
    {"name": "Glasgow - M8 Kingston Bridge", "lat": 55.8580, "lon": -4.2690, "road": "motorway", "speed": 90},
    {"name": "Bristol - M32 Gateway", "lat": 51.4630, "lon": -2.5780, "road": "secondary", "speed": 70},
    {"name": "Newcastle - Tyne Bridge Corridor", "lat": 54.9680, "lon": -1.6060, "road": "primary", "speed": 50},
    {"name": "Edinburgh - City Bypass A720", "lat": 55.9050, "lon": -3.2050, "road": "motorway", "speed": 100},
    {"name": "Cardiff - A48 Eastern Ave", "lat": 51.5030, "lon": -3.1590, "road": "primary", "speed": 80},
    {"name": "Cotswolds - Rural Route B4425", "lat": 51.7640, "lon": -1.8250, "road": "rural", "speed": 70},
    {"name": "Highlands - A82 Glencoe pass", "lat": 56.6660, "lon": -4.9800, "road": "rural", "speed": 90},
    {"name": "Liverpool - Queensway Tunnel Portal", "lat": 53.4070, "lon": -2.9830, "road": "secondary", "speed": 50}
]

WEATHERS = ["clear", "rain", "rain", "snow", "fog", "storm"]
LIGHTS = ["daylight", "twilight", "dark-lit", "dark-unlit"]
DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def generate_single_incident():
    loc = random.choice(UK_CITIES)
    weather_val = random.choice(WEATHERS)
    light_val = random.choice(LIGHTS)
    veh_count = random.choices([1, 2, 3, 4, 5], weights=[0.25, 0.45, 0.20, 0.07, 0.03])[0]
    hour = random.randint(0, 23)
    minute = random.randint(0, 59)
    time_str = f"{hour:02d}:{minute:02d}"

    # Add small jitter to location
    lat = round(loc["lat"] + random.uniform(-0.03, 0.03), 4)
    lon = round(loc["lon"] + random.uniform(-0.03, 0.03), 4)

    speed = max(30, int(loc["speed"] + random.gauss(0, 10)))

    # Run inference
    engine = get_engine()
    input_obj = AccidentPredictionInput(
        weather=WeatherEnum(weather_val),
        road_type=RoadTypeEnum(loc["road"]),
        speed_limit=speed,
        light_condition=LightConditionEnum(light_val),
        vehicle_count=veh_count,
        time_of_day=time_str,
        day_of_week=random.choice(DAYS),
        latitude=lat,
        longitude=lon
    )

    pred = engine.predict(input_obj)

    headline = (
        f"{'CRITICAL FATAL WARNING' if pred.severity == 'Fatal' else ('SERIOUS ALERT' if pred.severity == 'Serious' else 'SLIGHT INCIDENT')} "
        f"on {loc['name']} ({weather_val.capitalize()}, {veh_count} vehicles, {speed} km/h)"
    )

    return {
        "id": str(uuid.uuid4())[:8],
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
        "location_name": loc["name"],
        "latitude": lat,
        "longitude": lon,
        "weather": weather_val,
        "road_type": loc["road"],
        "speed_limit": speed,
        "light_condition": light_val,
        "vehicle_count": veh_count,
        "time_of_day": time_str,
        "severity": pred.severity,
        "risk_score": pred.risk_score,
        "probabilities": pred.probabilities,
        "is_emergency_warning": pred.is_emergency_warning,
        "headline": headline,
        "top_reasons": [r.model_dump() for r in pred.top_reasons]
    }


@router.get("/simulate/stream")
async def sse_incident_stream():
    """SSE endpoint streaming live simulated accident telemetry with real-time ML risk scoring.
    """
    async def event_generator():
        while True:
            incident = generate_single_incident()
            payload = json.dumps(incident)
            yield f"data: {payload}\n\n"
            await asyncio.sleep(2.5)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*"
        }
    )


@router.websocket("/ws/simulate")
async def websocket_incident_stream(websocket: WebSocket):
    """WebSocket endpoint streaming live simulated accident incidents."""
    await websocket.accept()
    try:
        while True:
            incident = generate_single_incident()
            await websocket.send_json(incident)
            await asyncio.sleep(2.5)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
