import React from 'react';
import { HelpCircle, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { ReasonItem } from '../lib/types';

interface ShapExplainerProps {
  reasons: ReasonItem[];
  modelName?: string;
}

export const ShapExplainer: React.FC<ShapExplainerProps> = ({ reasons, modelName }) => {
  // Compute narrative summary sentence
  const topHazard = reasons.filter((r) => r.weight > 0)[0];
  const secondHazard = reasons.filter((r) => r.weight > 0)[1];
  const topMitigator = reasons.filter((r) => r.weight < 0)[0];

  let narrative = '';
  if (topHazard && secondHazard) {
    narrative = `${topHazard.feature} and ${secondHazard.feature} combined elevated total collision threat by ${(Math.abs(topHazard.weight + secondHazard.weight) * 100).toFixed(0)}%.`;
  } else if (topHazard) {
    narrative = `${topHazard.feature} represents the primary kinetic hazard driver (${topHazard.impact}).`;
  } else if (topMitigator) {
    narrative = `${topMitigator.feature} provides significant survivability buffer (${topMitigator.impact}).`;
  } else {
    narrative = 'Operational telemetry aligns with baseline historical road safety envelopes.';
  }

  return (
    <div className="glass-panel p-5 rounded-xl border border-panel-border space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-panel-border/50 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-neon-cyan" />
          <h3 className="font-mono text-sm font-bold tracking-wider text-white">
            WHY THIS PREDICTION // SHAP LOCAL ATTRIBUTION
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          ENGINE: {modelName || 'TREE ENSEMBLE'}
        </span>
      </div>

      {/* Plain Language Executive Summary */}
      <div className="p-3 rounded-lg bg-black/40 border border-slate-800 text-xs font-mono text-slate-200 flex items-start gap-2.5">
        <span className="text-neon-cyan font-bold text-sm leading-none pt-0.5">»</span>
        <div className="leading-relaxed">
          <span className="text-white font-semibold">{narrative}</span>
          <span className="text-slate-400 block mt-0.5 text-[11px]">
            Explainability derived from Shapley additive values calibrated against UK STATS19 fatal accident outcomes.
          </span>
        </div>
      </div>

      {/* Animated Reordering SHAP Attribution Bars */}
      <div className="space-y-3 pt-1">
        {reasons.map((item, idx) => {
          const isPositive = item.weight > 0;
          const barWidth = Math.min(100, Math.max(12, Math.abs(item.weight) * 200));

          return (
            <div
              key={`${item.feature}-${idx}`}
              className="group p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-all duration-300"
            >
              <div className="flex items-center justify-between font-mono text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  {isPositive ? (
                    <TrendingUp className="w-3.5 h-3.5 text-neon-magenta" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-neon-cyan" />
                  )}
                  <span className="text-slate-200 font-semibold group-hover:text-white transition-colors">
                    {item.feature}
                  </span>
                </div>
                <span
                  className={`font-mono text-xs font-bold px-1.5 py-0.2 rounded ${
                    isPositive ? 'text-neon-magenta bg-neon-magenta/10' : 'text-neon-cyan bg-neon-cyan/10'
                  }`}
                >
                  {item.impact}
                </span>
              </div>

              {/* Bar visualization */}
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden flex items-center mb-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    isPositive
                      ? item.weight >= 0.25
                        ? 'bg-neon-magenta shadow-glow-magenta'
                        : 'bg-neon-amber shadow-glow-amber'
                      : 'bg-neon-cyan shadow-glow-cyan'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <div className="text-[11px] font-mono text-slate-400 group-hover:text-slate-300 transition-colors">
                {item.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShapExplainer;
