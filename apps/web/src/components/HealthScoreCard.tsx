"use client";

import React from "react";
import { HealthScoreBreakdown } from "@dji-fleet/shared";
import { ShieldCheck, AlertCircle, Info, CheckCircle2 } from "lucide-react";

interface HealthScoreCardProps {
  healthBreakdown?: HealthScoreBreakdown;
  healthScore?: number;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({
  healthBreakdown,
  healthScore = 100,
}) => {
  const score = healthBreakdown?.overallScore ?? healthScore;
  const isSufficient = healthBreakdown?.isSufficientTelemetry ?? true;

  const getScoreColor = (val: number | null | undefined) => {
    if (val == null) return "text-slate-500";
    if (val >= 90) return "text-emerald-400";
    if (val >= 75) return "text-amber-400";
    return "text-rose-400";
  };

  const getScoreBadgeBg = (val: number) => {
    if (val >= 90) return "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
    if (val >= 75) return "bg-amber-500/15 border-amber-500/30 text-amber-400";
    return "bg-rose-500/15 border-rose-500/30 text-rose-400";
  };

  const categories = [
    { name: "GPS Quality", score: healthBreakdown?.gpsScore },
    { name: "Battery Health", score: healthBreakdown?.batteryScore },
    { name: "RC Signal", score: healthBreakdown?.rcScore },
    { name: "Navigation", score: healthBreakdown?.navigationScore },
    { name: "Flight Stability", score: healthBreakdown?.stabilityScore },
  ];

  return (
    <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-5 shadow-xl">
      {/* Header with Score */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div>
          <div className="text-xs font-mono uppercase text-slate-400 tracking-wider">
            FLIGHT INTEGRITY & HEALTH
          </div>
          <div className="text-sm font-semibold text-slate-200 mt-0.5">
            Rule-Based Explainable Metric
          </div>
        </div>

        <div className={`px-4 py-2 rounded-xl border flex items-center gap-2.5 font-mono ${getScoreBadgeBg(score)}`}>
          <ShieldCheck className="w-5 h-5" />
          <span className="text-2xl font-bold">{score}</span>
          <span className="text-xs opacity-70">/ 100</span>
        </div>
      </div>

      {/* Category Breakdown (Section 23) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-4">
        {categories.map((cat) => (
          <div key={cat.name} className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg text-center">
            <div className="text-[10px] text-slate-400 font-mono truncate">{cat.name}</div>
            <div className={`text-base font-bold font-mono mt-1 ${getScoreColor(cat.score)}`}>
              {cat.score != null ? `${cat.score}` : "N/A"}
            </div>
            {cat.score == null && (
              <div className="text-[9px] text-slate-500 mt-0.5">No Telemetry</div>
            )}
          </div>
        ))}
      </div>

      {/* Deductions and Explanations */}
      <div>
        <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-sky-400" />
          <span>Transparent Point Deductions Log:</span>
        </div>

        {healthBreakdown?.deductions && healthBreakdown.deductions.length > 0 ? (
          <div className="space-y-1.5">
            {healthBreakdown.deductions.map((d, i) => (
              <div
                key={i}
                className="flex items-start gap-2 bg-slate-900/60 border border-slate-800/60 p-2 rounded-lg text-xs"
              >
                <span className="font-mono font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                  -{d.points}
                </span>
                <span className="text-slate-300">
                  <strong className="text-slate-200 font-mono mr-1">[{d.category}]</strong>
                  {d.reason}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {isSufficient
                ? "Zero penalties. All operational thresholds (GPS, battery temperature, RC link, stability) operated strictly within safe flight limits."
                : "Not enough high-frequency telemetry samples available to calculate category deductions."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
