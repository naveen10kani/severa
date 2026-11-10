import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { CommandHeader } from '../components/CommandHeader';
import { ModelMetricsResponse } from '../lib/types';
import { fetchMetrics } from '../lib/api';
import { 
  Cpu, Award, ShieldAlert, BarChart2, Activity, 
  CheckCircle2, ArrowUpRight, HelpCircle, Sparkles 
} from 'lucide-react';

export default function ModelLabPage() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('Random Forest (Recall-Tuned)');

  useEffect(() => {
    fetchMetrics()
      .then((data) => {
        setMetrics(data);
        if (data.best_model) setSelectedModel(data.best_model);
      })
      .catch((err) => {
        console.warn('Metrics API notice, loading static bundle:', err);
      });
  }, []);

  const modelsList = metrics ? Object.keys(metrics.models) : [
    'Random Forest (Recall-Tuned)',
    'XGBoost (SMOTE)',
    'LightGBM',
    'Logistic Regression'
  ];

  const currentModelData = metrics?.models[selectedModel];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Head>
        <title>SEVERA // Model Lab & Benchmark Matrix</title>
      </Head>

      <CommandHeader
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-panel-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-neon-cyan/10 border border-neon-cyan/40 text-neon-cyan">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-xl font-bold tracking-wider text-white">
                  MODEL BENCHMARK LAB // 4-ALGORITHM EVALUATION
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/40 font-bold">
                  RECALL-OPTIMIZED
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                UK STATS19 (50,000 Records) // Class Imbalance Weighted &amp; SMOTE Benchmarking
              </p>
            </div>
          </div>

          {/* Model Selector Tabs */}
          <div className="flex flex-wrap gap-1 bg-black/40 p-1 rounded-lg border border-slate-800 font-mono text-xs">
            {modelsList.map((m) => {
              const isSelected = selectedModel === m;
              const isBest = metrics?.best_model === m;
              return (
                <button
                  key={m}
                  onClick={() => setSelectedModel(m)}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-neon-cyan text-black font-bold shadow-glow-cyan'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isBest && <Award className="w-3.5 h-3.5 text-amber-500" />}
                  <span>{m}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Highlighted Critical Philosophy Banner: Fatal Recall Optimization */}
        <div className="glass-panel p-5 rounded-xl border border-neon-magenta/50 bg-neon-magenta/[0.04] space-y-3">
          <div className="flex items-center gap-2 text-neon-magenta font-mono font-bold text-sm">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <span>TRIAGE OBJECTIVE: WHY OPTIMIZE RECALL ON FATAL ACCIDENTS?</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
              <div className="text-neon-magenta font-bold mb-1">01. LIFE-CRITICAL ASYMMETRY</div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                In road trauma dispatch, a False Negative (misclassifying a Fatal accident as Slight) creates catastrophic response delays during the golden hour.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
              <div className="text-neon-amber font-bold mb-1">02. ACCEPTABLE OVER-TRIAGE</div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                A False Positive (dispatching advanced trauma units to a Serious accident) mobilizes precautionary aid which can easily be stood down once on scene.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
              <div className="text-neon-cyan font-bold mb-1">03. EXTREME CLASS IMBALANCE</div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Fatal collisions represent only ~2-5% of real-world road data. Standard accuracy models achieve 95% simply by predicting "Slight" for every collision.
              </p>
            </div>
          </div>
        </div>

        {/* Selected Model Performance Cards Grid */}
        {currentModelData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
            {/* Fatal Recall (Hero Metric) */}
            <div className="glass-panel p-4 rounded-xl border border-neon-magenta/40 relative overflow-hidden">
              <div className="text-[11px] text-neon-magenta font-bold tracking-wider">
                FATAL RECALL (SENSITIVITY)
              </div>
              <div className="text-3xl font-black text-white mt-1">
                {(currentModelData.fatal_recall * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Caught {Math.round(currentModelData.fatal_recall * 100)} of every 100 fatal emergencies
              </div>
            </div>

            {/* Macro F1 */}
            <div className="glass-panel p-4 rounded-xl border border-panel-border">
              <div className="text-[11px] text-neon-cyan font-bold tracking-wider">
                MACRO F1-SCORE
              </div>
              <div className="text-3xl font-black text-white mt-1">
                {currentModelData.macro_f1.toFixed(3)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Harmonic balance across all 3 classes
              </div>
            </div>

            {/* ROC-AUC */}
            <div className="glass-panel p-4 rounded-xl border border-panel-border">
              <div className="text-[11px] text-neon-amber font-bold tracking-wider">
                ROC-AUC (OVR)
              </div>
              <div className="text-3xl font-black text-white mt-1">
                {currentModelData.roc_auc.toFixed(3)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Discriminative separation capacity
              </div>
            </div>

            {/* Overall Accuracy */}
            <div className="glass-panel p-4 rounded-xl border border-panel-border">
              <div className="text-[11px] text-slate-300 font-bold tracking-wider">
                OVERALL ACCURACY
              </div>
              <div className="text-3xl font-black text-white mt-1">
                {(currentModelData.accuracy * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Penalized by intentional recall shift
              </div>
            </div>
          </div>
        )}

        {/* Side-by-Side: Multi-Model Metric Comparison & Confusion Matrix Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Models Comparison Table / Bars (7 cols) */}
          <div className="lg:col-span-7 glass-panel p-5 rounded-xl border border-panel-border space-y-4">
            <div className="flex items-center justify-between border-b border-panel-border/50 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-neon-cyan" />
                <h3 className="font-mono text-sm font-bold tracking-wider text-white">
                  HEAD-TO-HEAD BENCHMARK MATRIX
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">TEST SET (N = 10,000)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                    <th className="py-2">MODEL ARCHITECTURE</th>
                    <th className="py-2 text-neon-magenta font-bold">FATAL RECALL</th>
                    <th className="py-2">FATAL PREC</th>
                    <th className="py-2">MACRO F1</th>
                    <th className="py-2">ROC-AUC</th>
                    <th className="py-2">ACCURACY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {metrics &&
                    Object.entries(metrics.models).map(([name, m]) => {
                      const isSelected = selectedModel === name;
                      return (
                        <tr
                          key={name}
                          onClick={() => setSelectedModel(name)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-neon-cyan/15 text-white font-bold' : 'hover:bg-white/5 text-slate-300'
                          }`}
                        >
                          <td className="py-2.5 flex items-center gap-1.5">
                            {metrics.best_model === name && (
                              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            )}
                            <span className="truncate">{name}</span>
                          </td>
                          <td className="py-2.5 text-neon-magenta font-bold">
                            {(m.fatal_recall * 100).toFixed(1)}%
                          </td>
                          <td className="py-2.5 text-slate-300">
                            {(m.per_class.Fatal.precision * 100).toFixed(1)}%
                          </td>
                          <td className="py-2.5 text-slate-300">{m.macro_f1.toFixed(3)}</td>
                          <td className="py-2.5 text-slate-300">{m.roc_auc.toFixed(3)}</td>
                          <td className="py-2.5 text-slate-300">{(m.accuracy * 100).toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Visual comparative bar */}
            {metrics && (
              <div className="pt-3 border-t border-panel-border/50 space-y-2">
                <div className="text-[11px] font-mono text-slate-400">
                  FATAL RECALL COMPARISON (HIGHER = SAFER EARLY WARNING)
                </div>
                <div className="space-y-2 font-mono text-xs">
                  {Object.entries(metrics.models).map(([name, m]) => (
                    <div key={name} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300">{name}</span>
                        <span className="text-neon-magenta font-bold">{(m.fatal_recall * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-neon-magenta rounded-full transition-all duration-700"
                          style={{ width: `${m.fatal_recall * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confusion Matrix Heatmap (5 cols) */}
          <div className="lg:col-span-5 glass-panel p-5 rounded-xl border border-panel-border space-y-4">
            <div className="flex items-center justify-between border-b border-panel-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-neon-cyan" />
                <h3 className="font-mono text-sm font-bold tracking-wider text-white">
                  CONFUSION MATRIX HEATMAP
                </h3>
              </div>
              <span className="text-[10px] font-mono text-neon-cyan">{selectedModel}</span>
            </div>

            {currentModelData && (
              <div className="space-y-3 font-mono">
                <div className="grid grid-cols-4 gap-1 text-center text-xs">
                  <div className="p-2 text-slate-500 font-bold text-[10px] flex items-center justify-center">
                    ACTUAL \ PRED
                  </div>
                  <div className="p-2 bg-black/40 text-neon-cyan font-bold rounded">SLIGHT</div>
                  <div className="p-2 bg-black/40 text-neon-amber font-bold rounded">SERIOUS</div>
                  <div className="p-2 bg-black/40 text-neon-magenta font-bold rounded">FATAL</div>

                  {/* Row 0: Actual Slight */}
                  <div className="p-2 bg-black/40 text-neon-cyan font-bold rounded flex items-center justify-center">
                    SLIGHT
                  </div>
                  {currentModelData.confusion_matrix[0].map((val, colIdx) => (
                    <div
                      key={colIdx}
                      className={`p-3 rounded flex flex-col items-center justify-center border ${
                        colIdx === 0
                          ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan font-bold'
                          : 'bg-black/20 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="text-sm font-bold">{val}</span>
                      <span className="text-[9px] text-slate-500">
                        {Math.round((val / (currentModelData.confusion_matrix[0].reduce((a, b) => a + b, 0) || 1)) * 100)}%
                      </span>
                    </div>
                  ))}

                  {/* Row 1: Actual Serious */}
                  <div className="p-2 bg-black/40 text-neon-amber font-bold rounded flex items-center justify-center">
                    SERIOUS
                  </div>
                  {currentModelData.confusion_matrix[1].map((val, colIdx) => (
                    <div
                      key={colIdx}
                      className={`p-3 rounded flex flex-col items-center justify-center border ${
                        colIdx === 1
                          ? 'bg-neon-amber/20 border-neon-amber text-neon-amber font-bold'
                          : colIdx === 2
                          ? 'bg-neon-magenta/15 border-neon-magenta/40 text-neon-magenta'
                          : 'bg-black/20 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="text-sm font-bold">{val}</span>
                      <span className="text-[9px] text-slate-500">
                        {Math.round((val / (currentModelData.confusion_matrix[1].reduce((a, b) => a + b, 0) || 1)) * 100)}%
                      </span>
                    </div>
                  ))}

                  {/* Row 2: Actual Fatal */}
                  <div className="p-2 bg-black/40 text-neon-magenta font-bold rounded flex items-center justify-center">
                    FATAL
                  </div>
                  {currentModelData.confusion_matrix[2].map((val, colIdx) => (
                    <div
                      key={colIdx}
                      className={`p-3 rounded flex flex-col items-center justify-center border ${
                        colIdx === 2
                          ? 'bg-neon-magenta/25 border-neon-magenta text-neon-magenta font-black shadow-glow-magenta'
                          : 'bg-black/20 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="text-sm font-bold">{val}</span>
                      <span className="text-[9px] text-slate-400">
                        {colIdx === 2 ? 'RECALL HIT' : 'MISSED'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-black/30 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  Notice that the bottom-right cell (Actual Fatal predicted as Fatal) achieves the highest sensitivity, ensuring life-saving response readiness.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global SHAP Feature Importance */}
        {metrics && metrics.shap_importance && (
          <div className="glass-panel p-5 rounded-xl border border-panel-border space-y-4">
            <div className="flex items-center justify-between border-b border-panel-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-neon-cyan" />
                <h3 className="font-mono text-sm font-bold tracking-wider text-white">
                  GLOBAL SHAP FEATURE IMPORTANCE (FATAL CLASS EXPLAINABILITY)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">MEAN |SHAP VALUE|</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 font-mono text-xs">
              {Object.entries(metrics.shap_importance).slice(0, 10).map(([feat, score], idx) => {
                const maxVal = Math.max(...Object.values(metrics.shap_importance));
                const pct = (score / maxVal) * 100;
                return (
                  <div key={feat} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">
                        {idx + 1}. {feat}
                      </span>
                      <span className="text-neon-cyan font-bold">{score.toFixed(4)}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neon-cyan rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
