import React from 'react';
import { AlertOctagon, Siren, ShieldCheck, AlertTriangle, Zap, Radio } from 'lucide-react';
import { PredictionResponse } from '../lib/types';

interface SeverityGaugeProps {
  prediction: PredictionResponse | null;
  isLoading?: boolean;
}

export const SeverityGauge: React.FC<SeverityGaugeProps> = ({ prediction, isLoading }) => {
  const riskScore = prediction?.risk_score ?? 15;
  const severity = prediction?.severity ?? 'Slight';
  const isFatal = severity === 'Fatal';
  const isSerious = severity === 'Serious';

  // SVG Gauge calculations (semi-circle or full circular gauge)
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  // Use 75% arc (270 degrees)
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (riskScore / 100) * arcLength;

  const colorHex = isFatal ? '#ff0055' : isSerious ? '#ffb703' : '#00f0ff';
  const glowClass = isFatal ? 'shadow-glow-magenta' : isSerious ? 'shadow-glow-amber' : 'shadow-glow-cyan';

  return (
    <>
      {/* Full-Screen Code Red vignette when Fatal — glow instead of a hard frame */}
      {isFatal && (
        <div className="fixed inset-0 pointer-events-none z-40 animate-pulse-fatal" />
      )}

      <div className={`glass-panel p-6 rounded-xl border relative overflow-hidden transition-all duration-500 ${
        isFatal 
          ? 'glass-panel-fatal border-neon-magenta/60' 
          : isSerious 
          ? 'glass-panel-amber border-neon-amber/50' 
          : 'border-panel-border'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-panel-border/50 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${isFatal ? 'text-neon-magenta animate-spin' : 'text-neon-cyan'}`} />
            <span className="font-mono text-xs tracking-wider text-slate-300 uppercase">
              SEVERITY RISK METRIC // LIVE RADIAL
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-widest font-bold border ${
            isFatal
              ? 'bg-neon-magenta/20 text-neon-magenta border-neon-magenta animate-pulse'
              : isSerious
              ? 'bg-neon-amber/20 text-neon-amber border-neon-amber'
              : 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan'
          }`}>
            {isFatal ? 'EMERGENCY PROTOCOL ACTIVE' : isSerious ? 'HEIGHTENED WATCH' : 'NOMINAL SAFETY'}
          </span>
        </div>

        {/* Circular Radial Meter Display */}
        <div className="flex flex-col items-center justify-center my-4 relative">
          <div className="relative w-52 h-52 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-135" viewBox="0 0 200 200">
              {/* Background Arc */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#121829"
                strokeWidth="14"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeLinecap="round"
              />
              {/* Active Progress Arc */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={colorHex}
                strokeWidth="14"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
                style={{
                  filter: `drop-shadow(0 0 10px ${colorHex})`,
                }}
              />
            </svg>

            {/* Inner Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-mono text-slate-400 tracking-wider">RISK INDEX</span>
              <div className="flex items-baseline justify-center">
                <span className={`text-5xl font-mono font-black tracking-tighter ${
                  isFatal ? 'text-neon-magenta text-glow-magenta' : isSerious ? 'text-neon-amber text-glow-amber' : 'text-neon-cyan text-glow-cyan'
                }`}>
                  {riskScore}
                </span>
                <span className="text-xs font-mono text-slate-500 ml-1">/100</span>
              </div>
              <div className={`mt-1 px-3 py-0.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase border ${
                isFatal 
                  ? 'bg-neon-magenta/20 text-neon-magenta border-neon-magenta shadow-glow-magenta' 
                  : isSerious 
                  ? 'bg-neon-amber/20 text-neon-amber border-neon-amber' 
                  : 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan'
              }`}>
                {severity}
              </div>
            </div>
          </div>
        </div>

        {/* Probabilities Distribution Breakdown */}
        {prediction && (
          <div className="space-y-2 mt-4 pt-3 border-t border-panel-border/40 font-mono text-xs">
            <div className="flex justify-between text-slate-400 text-[10px] tracking-wider mb-1">
              <span>MODEL CLASS PROBABILITIES</span>
              <span>CALIBRATED ENSEMBLE</span>
            </div>

            <div className="space-y-1.5">
              {/* Slight */}
              <div>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-slate-300">Slight</span>
                  <span className="text-neon-cyan">{Math.round(prediction.probabilities.Slight * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neon-cyan rounded-full transition-all duration-500"
                    style={{ width: `${prediction.probabilities.Slight * 100}%` }}
                  />
                </div>
              </div>

              {/* Serious */}
              <div>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-slate-300">Serious</span>
                  <span className="text-neon-amber">{Math.round(prediction.probabilities.Serious * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neon-amber rounded-full transition-all duration-500"
                    style={{ width: `${prediction.probabilities.Serious * 100}%` }}
                  />
                </div>
              </div>

              {/* Fatal */}
              <div>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-slate-300 font-bold">Fatal (Triage Target)</span>
                  <span className="text-neon-magenta font-bold">{Math.round(prediction.probabilities.Fatal * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neon-magenta rounded-full transition-all duration-500 shadow-glow-magenta"
                    style={{ width: `${prediction.probabilities.Fatal * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Dispatch Banner / Trigger */}
        {isFatal ? (
          <div className="mt-4 p-3 rounded-lg bg-neon-magenta/20 border border-neon-magenta flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2 text-neon-magenta font-mono text-xs">
              <Siren className="w-5 h-5 animate-spin" />
              <div>
                <div className="font-bold tracking-wider">CODE RED: DISPATCH TRIGGERED</div>
                <div className="text-[10px] text-rose-300">HEMS & Air Ambulance Pre-Alert Initiated</div>
              </div>
            </div>
            <button className="px-3 py-1.5 rounded bg-neon-magenta text-black font-mono font-bold text-xs hover:bg-rose-400 tracking-wider shadow-glow-magenta transition-all">
              OVERRIDE
            </button>
          </div>
        ) : isSerious ? (
          <div className="mt-4 p-2.5 rounded-lg bg-neon-amber/15 border border-neon-amber/40 flex items-center gap-2 text-neon-amber font-mono text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <div>
              <span className="font-bold">SERIOUS CASUALTY RISK:</span> Paramedic rapid response advised.
            </div>
          </div>
        ) : (
          <div className="mt-4 p-2.5 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 flex items-center gap-2 text-neon-cyan font-mono text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <div>
              <span className="font-bold">LOW CRITICALITY:</span> Standard road policing triage.
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SeverityGauge;
