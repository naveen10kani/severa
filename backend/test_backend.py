import sys
import json
from app.models.schemas import AccidentPredictionInput, WeatherEnum, RoadTypeEnum, LightConditionEnum
from app.core.inference import SeveraInferenceEngine

def test_inference():
    print("Testing SeveraInferenceEngine locally...")
    engine = SeveraInferenceEngine("backend/app/models_artifact/severa_best_model.joblib")

    # High risk test: Night, Storm, Motorway, 120 km/h, 4 vehicles
    high_risk_input = AccidentPredictionInput(
        weather=WeatherEnum.storm,
        road_type=RoadTypeEnum.motorway,
        speed_limit=120,
        light_condition=LightConditionEnum.dark_unlit,
        vehicle_count=4,
        time_of_day="23:30",
        day_of_week="Saturday",
        latitude=51.5,
        longitude=-0.12
    )
    res_high = engine.predict(high_risk_input)
    print(f"\n[High Risk Scenario]: Severity={res_high.severity}, Risk Score={res_high.risk_score}, Warning={res_high.is_emergency_warning}")
    print(f"Probabilities: {res_high.probabilities}")
    print("Top reasons:")
    for r in res_high.top_reasons:
        print(f" - {r.feature}: {r.impact} ({r.description})")

    # Low risk test: Daylight, Clear, Residential, 30 km/h, 1 vehicle
    low_risk_input = AccidentPredictionInput(
        weather=WeatherEnum.clear,
        road_type=RoadTypeEnum.residential,
        speed_limit=30,
        light_condition=LightConditionEnum.daylight,
        vehicle_count=1,
        time_of_day="11:00",
        day_of_week="Wednesday",
        latitude=51.5,
        longitude=-0.12
    )
    res_low = engine.predict(low_risk_input)
    print(f"\n[Low Risk Scenario]: Severity={res_low.severity}, Risk Score={res_low.risk_score}, Warning={res_low.is_emergency_warning}")
    print(f"Probabilities: {res_low.probabilities}")
    print("Top reasons:")
    for r in res_low.top_reasons:
        print(f" - {r.feature}: {r.impact} ({r.description})")

    assert res_high.risk_score > res_low.risk_score
    print("\nSanity assertion PASSED: High risk scenario scored higher than low risk scenario.")

if __name__ == '__main__':
    test_inference()
