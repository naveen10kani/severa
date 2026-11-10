import { AccidentPredictionInput, PredictionResponse, HotspotItem, ModelMetricsResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function predictAccidentSeverity(input: AccidentPredictionInput): Promise<PredictionResponse> {
  const res = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Prediction API error (${res.status}): ${errorText}`);
  }

  return res.json();
}

export async function fetchMetrics(): Promise<ModelMetricsResponse> {
  const res = await fetch(`${API_BASE_URL}/metrics`);
  if (!res.ok) {
    throw new Error(`Metrics API error (${res.status})`);
  }
  return res.json();
}

export async function fetchHotspots(): Promise<HotspotItem[]> {
  const res = await fetch(`${API_BASE_URL}/hotspots`);
  if (!res.ok) {
    throw new Error(`Hotspots API error (${res.status})`);
  }
  return res.json();
}
