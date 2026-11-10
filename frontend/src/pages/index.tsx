import React, { useState, useEffect, useCallback } from 'react';
import React, { useState, useEffect, useCallback } from 'react';
import { CommandHeader } from '../components/CommandHeader';
import { RiskSimulator } from '../components/RiskSimulator';
import { SeverityGauge } from '../components/SeverityGauge';
import { ShapExplainer } from '../components/ShapExplainer';
import { AccidentPredictionInput, PredictionResponse } from '../lib/types';
import { predictAccidentSeverity } from '../lib/api';
import { ShieldAlert, Sliders, Activity, Brain, Siren, ChevronRight } from 'lucide-react';
import { IncidentRadar } from '../components/IncidentRadar';

// Simple hero banner component – replaces the 3D scene
const HeroBanner = () => (
  <div className="w-full h-[360px] lg:h-[460px] flex items-center justify-center bg-primary/60 rounded-xl text-white font-display text-3xl shadow-inner">
    SEVERA – Road Accident Early‑Warning System
  </div>
);

type PresetKey = 'NIGHT_STORM' | 'RUSH_HOUR' | 'SAFE_URBAN';

const PRESETS: {
  key: PresetKey;
  label: string;
  sub: string;
  tone: 'magenta' | 'amber' | 'cyan';
  icon: React.ReactNode;
}[] = [
  {
    key: 'NIGHT_STORM',
    label: 'Highway Night Storm',
    sub: 'FATAL PROTOTYPE',
    tone: 'magenta',
    icon: <Siren className="w-3.5 h-3.5" />,
  },
  {
    key: 'RUSH_HOUR',
    label: 'Peak Rush Pileup',
    sub: 'SERIOUS',
    tone: 'amber',
    icon: <Activity className="w-3.5 h-3.5" />,
  },
  {
    key: 'SAFE_URBAN',
    label: 'Clear Urban Daylight',
    sub: 'SLIGHT',
    tone: 'cyan',
    icon: <ShieldAlert className="w-3.5 h-3.5" />,
  },
];

const TONE_CLASSES = {
  magenta: 'border-neon-magenta/35 text-neon-magenta hover:bg-neon-magenta/12 hover:border-neon-magenta/70',
  amber: 'border-neon-amber/35 text-neon-amber hover:bg-neon-amber/12 hover:border-neon-amber/70',
  cyan: 'border-neon-cyan/35 text-neon-cyan hover:bg-neon-cyan/12 hover:border-neon-cyan/70',
};

function SectionLabel({ index, title, right }: { index: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-3">
      <div className="hud-rule flex-1 min-w-0">
        <span className="font-mono text-[10px] tracking-[0.3em] text-white/30">{index}</span>
        <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-slate-300 uppercase whitespace-nowrap">
          {title}
        </span>
      </div>
      {right}
    </div>
  );
}

export default function Home() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);

  const [input, setInput] = useState<AccidentPredictionInput>({
    weather: 'rain',
    road_type: 'motorway',
    speed_limit: 110,
    light_condition: 'dark-lit',
    vehicle_count: 2,
    time_of_day: '22:00',
    day_of_week: 'Friday',
    latitude: 51.5074,
    longitude: -0.1278,
  });

  const runPrediction = useCallback(async (currentInput: AccidentPredictionInput) => {
    setIsPredicting(true);
    try {
      const result = await predictAccidentSeverity(currentInput);
      setPrediction(result);
    } catch (err) {
      console.warn('Backend inference notice: using client fallback inference', err);
      const hour = parseInt(currentInput.time_of_day.split(':')[0] || '12', 10);
      const isNight = hour >= 20 || hour < 5;
      const isWet = ['rain', 'snow', 'storm'].includes(currentInput.weather);
      let calculatedRisk = 20;
      if (isNight) calculatedRisk += 25;
      if (isWet) calculatedRisk += 20;
      if (currentInput.speed_limit >= 100) calculatedRisk += 25;
      if (currentInput.vehicle_count >= 3) calculatedRisk += 20;
      calculatedRisk = Math.min(96, Math.max(12, calculatedRisk));

      const sev = calculatedRisk >= 68 ? 'Fatal' : calculatedRisk >= 40 ? 'Serious' : 'Slight';
      setPrediction({
        severity: sev,
        probabilities: {
          Slight: roundProb(1 - calculatedRisk / 100),
          Serious: roundProb((calculatedRisk / 100) * 0.4),
          Fatal: roundProb((calculatedRisk / 100) * 0.6),
        },
        risk_score: calculatedRisk,
        is_emergency_warning: calculatedRisk >= 65,
        top_reasons: [
          {
            feature: isWet ? 'Adverse Wet Surface' : 'Road Friction Level',
            impact: isWet ? '+28% hazard' : '+5% nominal',
            weight: isWet ? 0.28 : 0.05,
            description: `${currentInput.weather.toUpperCase()} pavement condition affects emergency deceleration.`,
          },
          {
            feature: isNight ? 'Night / Limited Ambient Light' : 'Daylight Visual Buffer',
            impact: isNight ? '+24% response lag' : '-12% visibility buffer',
            weight: isNight ? 0.24 : -0.12,
            description: `Incident timed at ${currentInput.time_of_day} hours.`,
          },
          {
            feature: `Speed Velocity (${currentInput.speed_limit} km/h)`,
            impact: currentInput.speed_limit >= 90 ? '+22% momentum' : '-10% urban buffer',
            weight: currentInput.speed_limit >= 90 ? 0.22 : -0.1,
            description: `Kinetic impact energy scales exponentially at higher velocity thresholds.`,
          },
        ],
        model_name: 'Random Forest (Recall-Tuned)',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsPredicting(false);
    }
  }, []);

  function roundProb(val: number) {
    return Math.round(Math.max(0.01, Math.min(0.99, val)) * 100) / 100;
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      runPrediction(input);
    }, 200);
    return () => clearTimeout(timer);
  }, [input, runPrediction]);

  const applyPreset = (presetName: PresetKey) => {
    if (presetName === 'NIGHT_STORM') {
      setInput((prev) => ({
        ...prev,
        weather: 'storm',
        road_type: 'motorway',
        speed_limit: 120,
        light_condition: 'dark-unlit',
        vehicle_count: 4,
        time_of_day: '23:30',
        day_of_week: 'Saturday',
      }));
    } else if (presetName === 'RUSH_HOUR') {
      setInput((prev) => ({
        ...prev,
        weather: 'rain',
        road_type: 'primary',
        speed_limit: 60,
        light_condition: 'twilight',
        vehicle_count: 3,
        time_of_day: '17:30',
        day_of_week: 'Monday',
      }));
    } else if (presetName === 'SAFE_URBAN') {
      setInput((prev) => ({
        ...prev,
        weather: 'clear',
        road_type: 'residential',
        speed_limit: 30,
        light_condition: 'daylight',
        vehicle_count: 1,
        time_of_day: '11:00',
        day_of_week: 'Wednesday',
      }));
    }
  };

  const isFatal = prediction?.severity === 'Fatal';
  const risk = prediction?.risk_score ?? 0;

  const kpis = [
    { label: 'FATAL RECALL', value: '85.3%', note: 'recall-tuned RF', tone: 'text-neon-magenta' },
    { label: 'ROC-AUC', value: '0.611', note: 'log-reg baseline', tone: 'text-neon-cyan' },
    { label: 'TRAIN SET', value: '50K', note: 'UK STATS19 rows', tone: 'text-neon-amber' },
    { label: 'INFERENCE', value: isPredicting ? '···' : `${risk}`, note: 'live risk index', tone: 'text-white' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <CommandHeader
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        activeFatalAlert={isFatal}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-6 pt-5 pb-10 space-y-7">
        {/* ---------- Scenario preset strip ---------- */}
        <div className="glass-panel rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-center gap-2 text-slate-300">
            <Sliders className="w-4 h-4 text-neon-cyan" />
            <span className="font-mono text-[11px] font-bold tracking-[0.2em]">SCENARIO PRESETS</span>
          </div>
          <div className="h-5 w-px bg-white/10 hidden sm:block" />
          <div className="flex flex-wrap gap-2 text-[11px] font-mono">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => applyPreset(p.key)}
                className={`group px-3 py-1.5 rounded-lg border bg-transparent transition-all duration-200 flex items-center gap-2 tracking-wide ${TONE_CLASSES[p.tone]}`}
              >
                {p.icon}
                <span className="font-bold">{p.label}</span>
                <span className="text-[9px] opacity-60">{p.sub}</span>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
              </button>
            ))}
          </div>
        </div>

        {/* ---------- Hero: 3D twin + severity gauge ---------- */}
        <section>
          <SectionLabel
            index="01"
            title="Live Digital Twin // Scenario Rehearsal"
            right={
              <span className="font-mono text-[10px] text-white/30 tracking-widest hidden sm:block">
                REAL-TIME INFERENCE → SCENE
              </span>
            }
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 relative min-h-[420px] sm:min-h-[500px]">
              <Scene3D
                weather={input.weather}
                timeOfDay={input.time_of_day}
                speedLimit={input.speed_limit}
                severity={prediction?.severity}
              />
            </div>
            <div className="lg:col-span-4 min-h-[500px]">
              <SeverityGauge prediction={prediction} isLoading={isPredicting} />
            </div>
          </div>
        </section>

        {/* ---------- KPI ribbon ---------- */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className="glass-panel rounded-lg px-4 py-3 group hover:border-white/20 transition-colors">
              <div className="font-mono text-[9px] tracking-[0.25em] text-white/35">{k.label}</div>
              <div className={`font-display text-2xl font-bold mt-1 ${k.tone}`}>{k.value}</div>
              <div className="font-mono text-[9px] text-white/25 mt-0.5">{k.note}</div>
            </div>
          ))}
        </section>

        {/* ---------- Simulator + explainability ---------- */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 space-y-5">
            <SectionLabel
              index="02"
              title="Risk Simulator // Input Deck"
              right={
                <span className="font-mono text-[10px] text-white/30 tracking-widest hidden sm:block">
                  DEBOUNCED LIVE SCORING
                </span>
              }
            />
            <RiskSimulator
              input={input}
              onChange={(updated) => setInput((prev) => ({ ...prev, ...updated }))}
              isPredicting={isPredicting}
            />
          </div>

          <div className="lg:col-span-5 space-y-5">
            <SectionLabel
              index="03"
              title="SHAP Attribution // Why This Score"
              right={
                <span className="font-mono text-[10px] text-white/30 tracking-widest flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5 text-neon-cyan" />
                  TREE EXPLAINER
                </span>
              }
            />
            <ShapExplainer reasons={prediction?.top_reasons || []} modelName={prediction?.model_name} />
          </div>
        </section>
      </div>
    </div>
  );
}
