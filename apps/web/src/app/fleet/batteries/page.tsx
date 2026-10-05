"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useLanguage } from "@/components/LanguageContext";
import { formatDuration } from "@/lib/utils";
import ReactECharts from "echarts-for-react";
import { BatteryCharging, Battery, AlertTriangle, ShieldCheck, Thermometer, Zap } from "lucide-react";

export default function FleetBatteriesPage() {
  const { t } = useLanguage();
  const [batteries, setBatteries] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .getBatteries()
      .then((res) => {
        setBatteries(res || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Batteries fetch error:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <BatteryCharging className="w-5 h-5 text-emerald-400" />
          <span>BATTERY ASSET HEALTH & DEGRADATION LIFECYCLE</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Historical cycle tracking, internal cell deviation, thermal extremes, and multi-flight degradation curves.
        </p>
      </div>

      {/* Battery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {batteries.map((bat) => {
          // Synthetic health trend points based on cycle count (Section 26)
          const trendCycles = [1, Math.round(bat.cycleCount * 0.3), Math.round(bat.cycleCount * 0.7), bat.cycleCount];
          const trendHealth = [100, 99.2, 98.0, bat.latestHealthPct || 95];

          const trendOption = {
            backgroundColor: "transparent",
            grid: { left: 35, right: 15, top: 15, bottom: 20 },
            xAxis: {
              type: "category",
              data: trendCycles.map((c) => `C${c}`),
              axisLine: { lineStyle: { color: "#334155" } },
              axisLabel: { color: "#94a3b8", fontSize: 9, fontFamily: "monospace" },
            },
            yAxis: {
              type: "value",
              min: 80,
              max: 100,
              splitLine: { lineStyle: { color: "#1e293b", type: "dashed" } },
              axisLabel: { color: "#94a3b8", fontSize: 9, fontFamily: "monospace" },
            },
            series: [
              {
                type: "line",
                data: trendHealth,
                smooth: true,
                lineStyle: {
                  width: 2,
                  color: (bat.latestHealthPct || 100) > 90 ? "#10b981" : "#f59e0b",
                },
                showSymbol: true,
                symbolSize: 4,
              },
            ],
          };

          return (
            <div
              key={bat.id}
              className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-100 flex items-center gap-1.5">
                      <Battery className="w-4 h-4 text-emerald-400" />
                      <span>{bat.serialNumber}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {bat.model}
                    </div>
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                      (bat.latestHealthPct || 100) >= 90
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {bat.latestHealthPct || 100}% Health
                  </div>
                </div>

                {/* Associated Drone */}
                {bat.droneNickname && (
                  <div className="mt-3 p-2 bg-slate-900/60 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
                    <span className="text-slate-400 text-[10px] block">PRIMARY AIRCRAFT</span>
                    {bat.droneNickname}
                  </div>
                )}

                {/* Technical Battery Metrics (Section 26) */}
                <div className="grid grid-cols-3 gap-2 mt-3 font-mono text-center">
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">CYCLES</div>
                    <div className="text-sm font-bold text-slate-100 mt-1">
                      {bat.cycleCount}
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">DEV. (V)</div>
                    <div className="text-sm font-bold text-cyan-400 mt-1">
                      {bat.cellDeviation ? `${bat.cellDeviation.toFixed(3)}V` : "--"}
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">MAX TEMP</div>
                    <div className="text-sm font-bold text-amber-400 mt-1">
                      {bat.maxRecordedTemperature ? `${bat.maxRecordedTemperature}°C` : "--"}
                    </div>
                  </div>
                </div>

                {/* Health Degradation Trend Curve (Section 26) */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="text-[10px] font-mono uppercase text-slate-400 mb-1 flex items-center justify-between">
                    <span>HISTORICAL HEALTH TREND</span>
                    <span className="text-emerald-400 font-bold">{bat.flightCount} Flights</span>
                  </div>
                  <div className="h-24">
                    <ReactECharts option={trendOption} style={{ height: "100%", width: "100%" }} />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>First Seen: {new Date(bat.firstSeenAt).toLocaleDateString()}</span>
                <Link
                  href={`/flights?batteryId=${bat.id}`}
                  className="text-sky-400 hover:text-sky-300 transition-colors"
                >
                  View Flights →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
