import React, { useEffect, useMemo, useState } from 'react';
import { Crosshair, Flame, AlertTriangle, Layers, TrendingUp } from 'lucide-react';
import { HotspotItem } from '../lib/types';
import { fetchHotspots } from '../lib/api';

interface ClusterIntelligenceProps {
  onFocusHotspot?: (hotspot: HotspotItem) => void;
  activeHotspot?: HotspotItem | null;
}

/**
 * Ranked cluster intelligence sidebar — replaces the old live incident feed.
 * Aggregates UK STATS19 hotspot clusters from the backend and ranks them by risk.
 */
export const ClusterIntelligence: React.FC<ClusterIntelligenceProps> = ({ onFocusHotspot, activeHotspot }) => {
  const [hotspots, setHotspots] = useState<HotspotItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    fetchHotspots()
      .then((data) => {
        if (cancelled) return;
        setHotspots(data);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const ranked = useMemo(
    () => [...hotspots].sort((a, b) => b.risk_score - a.risk_score || b.total_accidents - a.total_accidents).slice(0, 9),
    [hotspots]
  );

  const totals = useMemo(
    () =>
      hotspots.reduce(
        (acc, h) => ({
          clusters: acc.clusters + 1,
          accidents: acc.accidents + h.total_accidents,
          fatalities: acc.fatalities + h.fatal_count,
          serious: acc.serious + h.serious_count,
        }),
        { clusters: 0, accidents: 0, fatalities: 0, serious: 0 }
      ),
    [hotspots]
  );

  const stats = [
    { label: 'CLUSTERS', value: totals.clusters, icon: Layers, tone: 'text-neon-cyan' },
    { label: 'ACCIDENTS', value: totals.accidents, icon: Crosshair, tone: 'text-white' },
    { label: 'FATALITIES', value: totals.fatalities, icon: Flame, tone: 'text-neon-magenta' },
    { label: 'SERIOUS', value: totals.serious, icon: AlertTriangle, tone: 'text-neon-amber' },
  ];

  return (
    <div className="glass-panel p-5 rounded-xl border border-panel-border flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-panel-border/50 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-neon-cyan" />
          <div>
            <h2 className="font-mono text-sm font-bold tracking-wider text-white">CLUSTER INTELLIGENCE</h2>
            <p className="text-[10px] font-mono text-slate-400">RANKED BY RISK DENSITY // UK STATS19</p>
          </div>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            status === 'ready'
              ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/40'
              : status === 'error'
              ? 'bg-neon-amber/10 text-neon-amber border-neon-amber/40'
              : 'bg-white/5 text-slate-400 border-white/10'
          }`}
        >
          {status === 'loading' ? 'SYNCING…' : status === 'error' ? 'OFFLINE' : 'LOADED'}
        </span>
      </div>

      {/* Aggregate KPI grid */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-lg bg-black/30 border border-white/[0.06] px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[9px] font-mono tracking-[0.18em] text-white/40">
                <Icon className={`w-3 h-3 ${s.tone}`} />
                {s.label}
              </div>
              <div className={`font-display text-xl font-bold mt-0.5 ${s.tone}`}>
                {status === 'loading' ? '––' : s.value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ranked list */}
      <div className="mt-4 flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.2em] text-white/40">TOP RISK CORRIDORS</span>
        <span className="font-mono text-[10px] text-white/25">SELECT TO INSPECT</span>
      </div>

      <div className="mt-2 space-y-1.5 overflow-y-auto pr-1 flex-1 min-h-[180px]">
        {status === 'loading' &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-white/[0.03] animate-pulse" style={{ animationDelay: `${i * 90}ms` }} />
          ))}

        {status === 'error' && (
          <div className="text-center py-6 font-mono text-[11px] text-slate-500 leading-relaxed">
            BACKEND UNREACHABLE
            <br />
            <span className="text-slate-600">start uvicorn on :8000</span>
          </div>
        )}

        {status === 'ready' &&
          ranked.map((h, i) => {
            const active = activeHotspot?.latitude === h.latitude && activeHotspot?.longitude === h.longitude;
            const level = h.risk_score >= 60 ? 'magenta' : h.risk_score >= 40 ? 'amber' : 'cyan';
            const barColor =
              level === 'magenta' ? 'bg-neon-magenta shadow-glow-magenta' : level === 'amber' ? 'bg-neon-amber' : 'bg-neon-cyan';
            const textColor =
              level === 'magenta' ? 'text-neon-magenta' : level === 'amber' ? 'text-neon-amber' : 'text-neon-cyan';

            return (
              <button
                key={`${h.latitude}-${h.longitude}`}
                onClick={() => onFocusHotspot?.(h)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all duration-200 group ${
                  active
                    ? 'bg-white/[0.07] border-neon-cyan/60'
                    : 'bg-black/25 border-white/[0.05] hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`font-mono text-[10px] font-bold ${textColor} w-5 shrink-0`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-mono text-[11px] text-slate-200 truncate">
                      {h.latitude.toFixed(2)}°N {Math.abs(h.longitude).toFixed(2)}°W
                    </span>
                    <span className="font-mono text-[9px] text-white/30 truncate hidden sm:inline capitalize">
                      {h.primary_road_type}
                    </span>
                  </div>
                  <span className={`font-mono text-[11px] font-black ${textColor} shrink-0`}>{h.risk_score}</span>
                </div>

                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${h.risk_score}%` }}
                    />
                  </div>
                  <span className="font-mono text-[9px] text-white/35 shrink-0">
                    {h.total_accidents} acc · <span className="text-neon-magenta">{h.fatal_count} F</span> ·{' '}
                    <span className="text-neon-amber">{h.serious_count} S</span>
                  </span>
                </div>
              </button>
            );
          })}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-panel-border/50 flex items-center justify-between font-mono text-[9px] text-white/30">
        <span>SOURCE: GET /hotspots</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-blink-fast" />
          LIVE CACHE
        </span>
      </div>
    </div>
  );
};

export default ClusterIntelligence;
