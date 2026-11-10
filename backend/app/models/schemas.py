from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Optional, Any
from enum import Enum


class WeatherEnum(str, Enum):
    clear = "clear"
    rain = "rain"
    snow = "snow"
    fog = "fog"
    storm = "storm"


class RoadTypeEnum(str, Enum):
    motorway = "motorway"
    primary = "primary"
    secondary = "secondary"
    residential = "residential"
    rural = "rural"


class LightConditionEnum(str, Enum):
    daylight = "daylight"
    twilight = "twilight"
    dark_lit = "dark-lit"
    dark_unlit = "dark-unlit"


class AccidentPredictionInput(BaseModel):
    weather: WeatherEnum = Field(..., description="Weather condition (clear, rain, snow, fog, storm)")
    road_type: RoadTypeEnum = Field(..., description="Road classification")
    speed_limit: int = Field(..., ge=20, le=160, description="Speed limit in km/h")
    light_condition: LightConditionEnum = Field(..., description="Ambient light condition")
    vehicle_count: int = Field(..., ge=1, le=10, description="Total vehicles involved")
    time_of_day: str = Field(default="14:00", description="Time formatted as HH:MM")
    day_of_week: str = Field(default="Monday", description="Day of week (e.g. Monday, Friday, Saturday)")
    latitude: float = Field(default=51.5074, ge=49.0, le=60.0, description="Latitude (UK coordinate default)")
    longitude: float = Field(default=-0.1278, ge=-10.0, le=3.0, description="Longitude")

    @field_validator('day_of_week')
    @classmethod
    def validate_day_of_week(cls, v: str) -> str:
        valid_days = {'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'}
        v_title = v.strip().capitalize()
        if v_title not in valid_days:
            raise ValueError(f"Day of week must be one of: {', '.join(valid_days)}")
        return v_title


class ReasonItem(BaseModel):
    feature: str
    impact: str  # e.g. "increases risk by 18%"
    weight: float
    description: str


class PredictionResponse(BaseModel):
    severity: str  # Slight, Serious, Fatal
    probabilities: Dict[str, float]  # {'Slight': 0.15, 'Serious': 0.35, 'Fatal': 0.50}
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Calibrated risk index (0 to 100)")
    is_emergency_warning: bool
    top_reasons: List[ReasonItem]
    model_name: str
    timestamp: str


class HotspotItem(BaseModel):
    latitude: float
    longitude: float
    total_accidents: int
    fatal_count: int
    serious_count: int
    slight_count: int
    risk_score: float
    primary_road_type: str
    common_weather: str


class SimulatedIncident(BaseModel):
    id: str
    timestamp: str
    latitude: float
    longitude: float
    weather: str
    road_type: str
    speed_limit: int
    light_condition: str
    vehicle_count: int
    severity: str
    risk_score: float
    is_emergency_warning: bool
    headline: str
