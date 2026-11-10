export type WeatherType = 'clear' | 'rain' | 'snow' | 'fog' | 'storm';
export type RoadType = 'motorway' | 'primary' | 'secondary' | 'residential' | 'rural';
export type LightCondition = 'daylight' | 'twilight' | 'dark-lit' | 'dark-unlit';
export type SeverityType = 'Slight' | 'Serious' | 'Fatal';

export interface AccidentPredictionInput {
  weather: WeatherType;
  road_type: RoadType;
  speed_limit: number;
  light_condition: LightCondition;
  vehicle_count: number;
  time_of_day: string;
  day_of_week: string;
  latitude: number;
  longitude: number;
}

export interface ReasonItem {
  feature: string;
  impact: string;
  weight: number;
  description: string;
}

export interface PredictionResponse {
  severity: SeverityType;
  probabilities: {
    Slight: number;
    Serious: number;
    Fatal: number;
  };
  risk_score: number;
  is_emergency_warning: boolean;
  top_reasons: ReasonItem[];
  model_name: string;
  timestamp: string;
}

export interface SimulatedIncident {
  id: string;
  timestamp: string;
  location_name: string;
  latitude: number;
  longitude: number;
  weather: WeatherType;
  road_type: RoadType;
  speed_limit: number;
  light_condition: LightCondition;
  vehicle_count: number;
  time_of_day: string;
  severity: SeverityType;
  risk_score: number;
  probabilities: {
    Slight: number;
    Serious: number;
    Fatal: number;
  };
  is_emergency_warning: boolean;
  headline: string;
  top_reasons: ReasonItem[];
}

export interface HotspotItem {
  latitude: number;
  longitude: number;
  total_accidents: number;
  fatal_count: number;
  serious_count: number;
  slight_count: number;
  risk_score: number;
  primary_road_type: string;
  common_weather: string;
}

export interface ModelMetricsResponse {
  best_model: string;
  models: {
    [name: string]: {
      accuracy: number;
      macro_f1: number;
      roc_auc: number;
      confusion_matrix: number[][];
      per_class: {
        [cls: string]: {
          precision: number;
          recall: number;
          f1: number;
        };
      };
      fatal_recall: number;
      fatal_f1: number;
    };
  };
  shap_importance: { [feat: string]: number };
  feature_names: string[];
  class_distribution: { [cls: string]: number };
  explanation_rationale: string;
  evaluated_at: string;
}
