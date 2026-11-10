# generate_synthetic.py – creates a realistic synthetic accident dataset (≈50k rows)
"""Synthetic dataset generator for SEVERA.
Columns roughly match the UK STATS19 / US Accidents schema:
- `date` (YYYY-MM-DD)
- `time_of_day` (HH:MM)
- `day_of_week` (Mon‑Sun)
- `weather` (clear, rain, snow, fog, storm)
- `road_type` (motorway, primary, secondary, residential, rural)
- `speed_limit` (km/h, typical values 30‑130)
- `light_condition` (daylight, twilight, dark‑lit, dark‑unlit)
- `vehicle_count` (1‑5)
- `latitude`, `longitude` (within a plausible UK bounding box)
- `severity` (Slight, Serious, Fatal)

The generator respects realistic correlations:
* Fatal accidents are more likely at night, in bad weather, on high‑speed roads, and with more vehicles.
* Serious accidents occur often in twilight/fog.
* Slight accidents dominate the dataset (~85%).

Running this script creates `synthetic_accidents.csv` under `ml/data/`.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

np.random.seed(42)

N = 50000

# Helper functions

def random_dates(start, end, n):
    start_u = start.timestamp()
    end_u = end.timestamp()
    return [datetime.fromtimestamp(s) for s in np.random.uniform(start_u, end_u, n)]

def choose_weighted(options, probs, size):
    return np.random.choice(options, size=size, p=probs)

# Base distributions (unconditional)
weather_opts = ['clear', 'rain', 'snow', 'fog', 'storm']
weather_probs = [0.6, 0.2, 0.05, 0.1, 0.05]

road_opts = ['motorway', 'primary', 'secondary', 'residential', 'rural']
road_probs = [0.15, 0.25, 0.25, 0.25, 0.10]

light_opts = ['daylight', 'twilight', 'dark-lit', 'dark-unlit']
light_probs = [0.5, 0.2, 0.2, 0.1]

severity_opts = ['Slight', 'Serious', 'Fatal']
# We'll initially sample uniform then re‑weight based on conditions later.

# Generate timestamps spanning two years
start_date = datetime(2020, 1, 1)
end_date = datetime(2022, 12, 31)
timestamps = random_dates(start_date, end_date, N)

# Build DataFrame
df = pd.DataFrame({
    'datetime': timestamps,
})

# Derive simple columns
df['date'] = df['datetime'].dt.date.astype(str)
df['time_of_day'] = df['datetime'].dt.strftime('%H:%M')
df['day_of_week'] = df['datetime'].dt.day_name()

# Random independent columns
df['weather'] = choose_weighted(weather_opts, weather_probs, N)
df['road_type'] = choose_weighted(road_opts, road_probs, N)
df['light_condition'] = choose_weighted(light_opts, light_probs, N)

# Speed limit – depends on road type (higher on motorway)
speed_means = {
    'motorway': 110,
    'primary': 80,
    'secondary': 70,
    'residential': 40,
    'rural': 60,
}
df['speed_limit'] = df['road_type'].apply(lambda rt: max(30, int(np.random.normal(speed_means[rt], 10))))

# Vehicle count – 1‑5, slight bias toward 2‑3 vehicles
veh_counts = [1, 2, 3, 4, 5]
veh_probs = [0.15, 0.4, 0.3, 0.1, 0.05]
df['vehicle_count'] = choose_weighted(veh_counts, veh_probs, N)

# Location – random lat/lon within UK approx bbox
lat_min, lat_max = 49.9, 58.6
lon_min, lon_max = -8.6, 1.8
df['latitude'] = np.random.uniform(lat_min, lat_max, N).round(6)
df['longitude'] = np.random.uniform(lon_min, lon_max, N).round(6)

# Compute severity probabilities conditioned on risk factors
risk = np.zeros(N)
# Night risk (hour >=20 or <5)
hour = df['datetime'].dt.hour
risk += ((hour >= 20) | (hour < 5)) * 0.2
# Bad weather risk
risk += df['weather'].isin(['rain', 'snow', 'storm', 'fog']) * 0.15
# High speed (>80) risk
risk += (df['speed_limit'] > 80) * 0.1
# Multiple vehicles risk
risk += (df['vehicle_count'] >= 3) * 0.1
# Light condition darkness risk
risk += df['light_condition'].isin(['dark-lit', 'dark-unlit']) * 0.05
# Normalize to [0,1] and map to severity distribution
risk_arr = np.asarray(risk)
risk_norm = np.clip(risk_arr, 0, 1)
# Map to probabilities for three classes
# Base rates: Slight 85%, Serious 13%, Fatal 2%
base = np.array([0.85, 0.13, 0.02])
# Adjust: shift weight from Slight toward Serious/Fatal proportionally to risk
adjust = risk_norm[:, None] * np.array([0.0, 0.6, 1.4])  # higher boost for Fatal
probs = base + adjust
probs = probs / probs.sum(axis=1, keepdims=True)
# Sample severity per row
severity = [np.random.choice(severity_opts, p=p) for p in probs]
df['severity'] = severity

# Drop helper column
df = df.drop(columns=['datetime'])

# Save CSV
output_path = "C:/Users/Naveen/OneDrive/Desktop/major project/ml/data/synthetic_accidents.csv"
df.to_csv(output_path, index=False)
print(f"Synthetic dataset generated: {output_path} ({len(df)} rows)")
