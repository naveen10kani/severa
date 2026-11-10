import React, { useState, useEffect } from 'react';
import { Compass, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, ShieldCheck, MapPin, X } from 'lucide-react';
import { HotspotItem } from '../lib/types';
import { fetchHotspots } from '../lib/api';

interface LiveHotspotMapProps {
  focusHotspot?: HotspotItem | null;
  interactive?: boolean;
}

export const LiveHotspotMap: React.FC<LiveHotspotMapProps> = ({ focusHotspot, interactive = true }) => {
  const [hotspots, setHotspots] = useState<HotspotItem[]>([]);
  const [activeHotspot, setActiveHotspot] = useState<HotspotItem | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [filterMode, setFilterMode] = useState<'ALL' | 'HIGH_RISK'>('ALL');

  useEffect(() => {
    fetchHotspots()
      .then((data) => setHotspots(data))
      .catch((err) => {
        console.warn('Fallback: loading local hotspots');
      });
  }, []);

  // Open the inspector when a corridor is picked from the ranking sidebar
  useEffect(() => {
    if (focusHotspot) setActiveHotspot(focusHotspot);
  }, [focusHotspot]);

  // Map coordinates projection from UK bbox:
  // Lat: 50.0 to 58.5 (South to North)
  // Lon: -8.0 to 2.0 (West to East)
  const mapWidth = 800;
  const mapHeight = 900;

  const project = (lat: number, lon: number): [number, number] => {
    const x = ((lon - (-8.0)) / (2.0 - (-8.0))) * mapWidth;
    // Invert Y because SVG coordinates go top-to-bottom
    const y = ((58.5 - lat) / (58.5 - 50.0)) * mapHeight;
    return [x, y];
  };

  const filteredHotspots = hotspots.filter((h) => {
    if (filterMode === 'HIGH_RISK') return h.risk_score >= 60;
    return true;
  });

  return (
    <div className="glass-panel p-5 rounded-xl border border-panel-border space-y-4 relative flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-panel-border/50 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-neon-cyan animate-spin-slow" />
          <div>
            <h2 className="font-mono text-sm font-bold tracking-wider text-white">
              TACTICAL INCIDENT HEATMAP // UK CLUSTERS
            </h2>
            <p className="text-[10px] font-mono text-slate-400">
              CLUSTER RESOLUTION: 1.1 KM GRID // UK STATS19 ARTERIALS
            </p>
          </div>
        </div>

        {/* Zoom & Mode Controls */}
        <div className="flex items-center gap-2">
          <div className="flex bg-black/40 rounded border border-slate-800 p-0.5">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                filterMode === 'ALL' ? 'bg-neon-cyan text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              ALL ({hotspots.length})
            </button>
            <button
              onClick={() => setFilterMode('HIGH_RISK')}
              className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                filterMode === 'HIGH_RISK' ? 'bg-neon-magenta text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              CRITICAL FATAL
            </button>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
              className="p-1 rounded bg-black/40 border border-slate-700 text-slate-300 hover:text-white"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
              className="p-1 rounded bg-black/40 border border-slate-700 text-slate-300 hover:text-white"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 rounded bg-black/40 border border-slate-700 text-slate-300 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Map Viewport */}
      <div className="relative flex-1 min-h-[460px] overflow-hidden rounded-lg bg-[#04060c] border border-panel-border/60">
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="w-full h-full transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          {/* Tactical Radar Grid Lines */}
          <defs>
            <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 240, 255, 0.05)" strokeWidth="1" />
            </pattern>
            <radialGradient id="fatalGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff0055" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ff0055" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="amberGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffb703" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffb703" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="cyanGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width={mapWidth} height={mapHeight} fill="url(#radarGrid)" />

          {/* Coordinate Circles / Distance Range Rings */}
          <circle cx={mapWidth / 2} cy={mapHeight / 2} r="180" fill="none" stroke="rgba(0, 240, 255, 0.08)" strokeDasharray="4 4" />
          <circle cx={mapWidth / 2} cy={mapHeight / 2} r="320" fill="none" stroke="rgba(0, 240, 255, 0.05)" strokeDasharray="4 4" />

          {/* UK Stylized Outline Guidance Path */}
          <path
            d="M 380 80 Q 420 120 400 180 Q 430 250 460 320 Q 520 400 500 500 Q 480 620 520 720 Q 460 780 380 820 Q 300 810 260 760 Q 280 680 340 600 Q 330 520 300 440 Q 320 340 340 240 Q 360 160 380 80 Z"
            fill="rgba(12, 18, 36, 0.3)"
            stroke="rgba(0, 240, 255, 0.15)"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />

          {/* Render Historical Hotspots */}
          {filteredHotspots.map((h, idx) => {
            const [cx, cy] = project(h.latitude, h.longitude);
            const isHigh = h.risk_score >= 60;
            const isMedium = h.risk_score >= 40 && h.risk_score < 60;
            const fillGrad = isHigh ? 'url(#fatalGlow)' : isMedium ? 'url(#amberGlow)' : 'url(#cyanGlow)';
            const pointColor = isHigh ? '#ff0055' : isMedium ? '#ffb703' : '#00f0ff';
            const radius = Math.min(24, Math.max(8, (h.total_accidents / 25) * 14));

            return (
              <g
                key={idx}
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={() => setActiveHotspot(h)}
              >
                {/* Heat aura */}
                <circle cx={cx} cy={cy} r={radius} fill={fillGrad} />
                {/* Solid core point */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={3.5}
                  fill={pointColor}
                  stroke="#ffffff"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Pulsing beacon on the corridor selected in the ranking sidebar */}
          {activeHotspot &&
            (() => {
              const [sx, sy] = project(activeHotspot.latitude, activeHotspot.longitude);
              const critical = activeHotspot.risk_score >= 60;
              const c = critical ? '#ff2d78' : '#22e6f2';
              return (
                <g>
                  <circle cx={sx} cy={sy} r="30" fill="none" stroke={c} strokeWidth="2" opacity="0.6" className="animate-ping" />
                  <circle cx={sx} cy={sy} r="15" fill="none" stroke={c} strokeWidth="2.5" />
                  <circle cx={sx} cy={sy} r="5" fill="#ffffff" />
                  <text x={sx + 12} y={sy + 4} fill={c} fontSize="12" fontFamily="monospace" fontWeight="bold">
                    FOCUS: {activeHotspot.risk_score}
                  </text>
                </g>
              );
            })()}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 glass-panel p-2.5 rounded border border-panel-border font-mono text-[10px] space-y-1">
          <div className="text-slate-400 font-bold mb-1">HEATMAP RISK GRADIENT</div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-neon-magenta shadow-glow-magenta" />
            <span>High Risk / Fatal Cluster (Score &gt;= 60)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-neon-amber" />
            <span>Medium Serious Cluster (Score 40-59)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-neon-cyan" />
            <span>Nominal Hazard (Score &lt; 40)</span>
          </div>
        </div>

        {/* Hotspot Inspector Modal / Popover */}
        {activeHotspot && (
          <div className="absolute top-4 right-4 w-72 glass-panel p-4 rounded-xl border border-neon-cyan/50 shadow-glow-cyan z-30 font-mono">
            <div className="flex items-center justify-between border-b border-panel-border pb-2 mb-3">
              <div className="flex items-center gap-1.5 text-xs text-neon-cyan font-bold">
                <MapPin className="w-4 h-4" />
                <span>HOTSPOT TELEMETRY</span>
              </div>
              <button
                onClick={() => setActiveHotspot(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">COORDINATES:</span>
                <span className="text-white font-bold">{activeHotspot.latitude}° N, {activeHotspot.longitude}° E</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">TOTAL ACCIDENTS:</span>
                <span className="text-white font-bold">{activeHotspot.total_accidents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">FATALITIES:</span>
                <span className="text-neon-magenta font-bold">{activeHotspot.fatal_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SERIOUS INJURIES:</span>
                <span className="text-neon-amber font-bold">{activeHotspot.serious_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ROAD CLASS:</span>
                <span className="text-slate-200 capitalize">{activeHotspot.primary_road_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">DOMINANT WEATHER:</span>
                <span className="text-slate-200 capitalize">{activeHotspot.common_weather}</span>
              </div>

              <div className="pt-2 border-t border-panel-border/50 flex justify-between items-center">
                <span className="text-slate-400">RISK DENSITY SCORE:</span>
                <span className={`text-base font-black px-2 py-0.5 rounded ${
                  activeHotspot.risk_score >= 60
                    ? 'bg-neon-magenta/20 text-neon-magenta border border-neon-magenta'
                    : 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan'
                }`}>
                  {activeHotspot.risk_score}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveHotspotMap;
