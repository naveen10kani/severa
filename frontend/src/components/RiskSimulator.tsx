import React from 'react';
import { 
  Sun, Moon, CloudRain, CloudSnow, CloudFog, Zap, 
  Car, Shield, Navigation, Home, Trees, AlertTriangle, Gauge
} from 'lucide-react';
import { WeatherType, RoadType, LightCondition, AccidentPredictionInput } from '../lib/types';

interface RiskSimulatorProps {
  input: AccidentPredictionInput;
  onChange: (updated: Partial<AccidentPredictionInput>) => void;
  isPredicting?: boolean;
}

export const RiskSimulator: React.FC<RiskSimulatorProps> = ({ input, onChange, isPredicting }) => {
  const hour = parseInt(input.time_of_day.split(':')[0] || '12', 10);

  // Quick weather presets
  const weathers: { id: WeatherType; label: string; icon: any; color: string }[] = [
    { id: 'clear', label: 'Clear', icon: Sun, color: 'text-amber-400 border-amber-400/40 bg-amber-400/10' },
    { id: 'rain', label: 'Rain', icon: CloudRain, color: 'text-neon-cyan border-neon-cyan/40 bg-neon-cyan/10' },
    { id: 'snow', label: 'Snow', icon: CloudSnow, color: 'text-blue-200 border-blue-200/40 bg-blue-200/10' },
    { id: 'fog', label: 'Fog', icon: CloudFog, color: 'text-slate-300 border-slate-300/40 bg-slate-300/10' },
    { id: 'storm', label: 'Storm', icon: Zap, color: 'text-neon-magenta border-neon-magenta/40 bg-neon-magenta/10' },
  ];

  // Road types
  const roadTypes: { id: RoadType; label: string; icon: any; typical: string }[] = [
    { id: 'motorway', label: 'Motorway', icon: Shield, typical: '110 km/h limit' },
    { id: 'primary', label: 'Primary A-Road', icon: Navigation, typical: '80 km/h limit' },
    { id: 'secondary', label: 'Secondary B-Road', icon: Car, typical: '60 km/h limit' },
    { id: 'residential', label: 'Residential', icon: Home, typical: '40 km/h limit' },
    { id: 'rural', label: 'Rural Route', icon: Trees, typical: '70 km/h limit' },
  ];

  // Light conditions
  const lightConditions: { id: LightCondition; label: string; desc: string }[] = [
    { id: 'daylight', label: 'Daylight', desc: 'Full solar visibility' },
    { id: 'twilight', label: 'Twilight', desc: 'Dusk / Dawn low angle' },
    { id: 'dark-lit', label: 'Dark - Lit', desc: 'Night with street lamps' },
    { id: 'dark-unlit', label: 'Dark - Unlit', desc: 'Zero artificial illumination' },
  ];

  // Day of week
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleHourChange = (newHour: number) => {
    const formatted = `${String(newHour).padStart(2, '0')}:00`;
    let autoLight: LightCondition = input.light_condition;
    if (newHour >= 7 && newHour < 18) {
      autoLight = 'daylight';
    } else if ((newHour >= 5 && newHour < 7) || (newHour >= 18 && newHour < 20)) {
      autoLight = 'twilight';
    } else {
      autoLight = input.light_condition === 'dark-unlit' ? 'dark-unlit' : 'dark-lit';
    }
    onChange({ time_of_day: formatted, light_condition: autoLight });
  };

  return (
    <div className="glass-panel p-5 rounded-xl border border-panel-border space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-panel-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-neon-cyan" />
          <h2 className="font-mono text-base font-bold tracking-wider text-white">
            MISSION PARAMETERS // RISK SIMULATOR
          </h2>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
          {isPredicting ? 'EVALUATING MODEL...' : 'LIVE ATTRIBUTION ACTIVE'}
        </span>
      </div>

      {/* 1. Day / Night Dial & Time Orbital Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <label className="text-slate-300 flex items-center gap-1.5">
            {hour >= 6 && hour < 19 ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neon-cyan" />}
            <span>DIURNAL CYCLE // TIME OF INCIDENT</span>
          </label>
          <span className="text-white font-bold bg-black/40 px-2 py-0.5 rounded border border-slate-700">
            {input.time_of_day} HRS ({hour >= 20 || hour < 5 ? 'NIGHT' : hour >= 7 && hour < 18 ? 'DAYLIGHT' : 'TWILIGHT'})
          </span>
        </div>

        {/* Tactical Dial / Range Track */}
        <div className="relative pt-2 pb-1">
          <input
            type="range"
            min={0}
            max={23}
            value={hour}
            onChange={(e) => handleHourChange(parseInt(e.target.value, 10))}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
          />
          {/* Hour markers */}
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>00:00 (Mid)</span>
            <span>06:00 (Dawn)</span>
            <span>12:00 (Noon)</span>
            <span>18:00 (Dusk)</span>
            <span>23:00 (Night)</span>
          </div>
        </div>
      </div>

      {/* 2. Speedometer Feel Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <label className="text-slate-300 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-neon-cyan" />
            <span>SPEED LIMIT / VELOCITY THRESHOLD</span>
          </label>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold font-mono px-2.5 py-0.5 rounded border ${
              input.speed_limit >= 100 
                ? 'text-neon-magenta border-neon-magenta/40 bg-neon-magenta/15' 
                : input.speed_limit >= 70 
                ? 'text-neon-amber border-neon-amber/40 bg-neon-amber/15' 
                : 'text-neon-cyan border-neon-cyan/40 bg-neon-cyan/15'
            }`}>
              {input.speed_limit} KM/H
            </span>
          </div>
        </div>

        <div className="relative pt-2">
          <input
            type="range"
            min={20}
            max={140}
            step={5}
            value={input.speed_limit}
            onChange={(e) => onChange({ speed_limit: parseInt(e.target.value, 10) })}
            className={`w-full h-2.5 rounded-lg appearance-none cursor-pointer ${
              input.speed_limit >= 100 ? 'accent-neon-magenta bg-rose-950/40' : input.speed_limit >= 70 ? 'accent-neon-amber bg-amber-950/40' : 'accent-neon-cyan bg-slate-800'
            }`}
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>30 (Urban)</span>
            <span>50 (Suburban)</span>
            <span>70 (Arterial)</span>
            <span>100 (Dual/Hwy)</span>
            <span>130 (Motorway)</span>
          </div>
        </div>
      </div>

      {/* 3. Weather Selector Pills */}
      <div className="space-y-2">
        <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
          <CloudRain className="w-4 h-4 text-neon-cyan" />
          <span>METEOROLOGICAL MATRIX</span>
        </label>
        <div className="grid grid-cols-5 gap-2">
          {weathers.map((w) => {
            const Icon = w.icon;
            const isSelected = input.weather === w.id;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => onChange({ weather: w.id })}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all duration-200 ${
                  isSelected
                    ? `${w.color} shadow-glow-cyan font-bold scale-[1.02]`
                    : 'bg-black/20 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-[11px] font-mono tracking-tight">{w.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Road Type Picker with Cards & Icons */}
      <div className="space-y-2">
        <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
          <Car className="w-4 h-4 text-neon-cyan" />
          <span>INFRASTRUCTURE & ROAD PROFILE</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {roadTypes.map((rt) => {
            const Icon = rt.icon;
            const isSelected = input.road_type === rt.id;
            return (
              <button
                key={rt.id}
                type="button"
                onClick={() => onChange({ road_type: rt.id })}
                className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all duration-200 ${
                  isSelected
                    ? 'bg-neon-cyan/15 border-neon-cyan/60 text-white shadow-glow-cyan'
                    : 'bg-black/20 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-neon-cyan">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-mono font-semibold">{rt.label}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{rt.typical}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Ambient Light & Vehicle Count Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Ambient Light */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-slate-300">LIGHT CONDITION</label>
          <div className="grid grid-cols-2 gap-1.5">
            {lightConditions.map((lc) => {
              const isSelected = input.light_condition === lc.id;
              return (
                <button
                  key={lc.id}
                  type="button"
                  onClick={() => onChange({ light_condition: lc.id })}
                  className={`p-2 rounded border text-left text-[11px] font-mono transition-all ${
                    isSelected
                      ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan font-bold'
                      : 'bg-black/30 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>{lc.label}</div>
                  <div className="text-[9px] text-slate-500 truncate">{lc.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Vehicles Involved */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-slate-300">VEHICLES INVOLVED</label>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((num) => {
              const isSelected = input.vehicle_count === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => onChange({ vehicle_count: num })}
                  className={`p-2 rounded border font-mono text-center transition-all ${
                    isSelected
                      ? num >= 3
                        ? 'bg-neon-magenta/20 border-neon-magenta text-neon-magenta font-bold shadow-glow-magenta'
                        : 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan font-bold shadow-glow-cyan'
                      : 'bg-black/30 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-sm">{num}</div>
                  <div className="text-[9px] text-slate-500">{num === 1 ? 'Solo' : 'Veh'}</div>
                </button>
              );
            })}
          </div>

          {/* Day of Week */}
          <div className="pt-1.5 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">DAY OF WEEK:</span>
            <select
              value={input.day_of_week}
              onChange={(e) => onChange({ day_of_week: e.target.value })}
              className="bg-black/50 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:border-neon-cyan outline-none"
            >
              {days.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskSimulator;
