"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import ReactECharts from "echarts-for-react";
import { BarChart3, TrendingUp, Cpu, Users, AlertTriangle } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.getDashboard().then((res) => setData(res));
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-xs font-mono text-slate-400">LOADING ANALYTICS...</span>
      </div>
    );
  }

  // Monthly Distance Chart
  const distanceChart = {
    backgroundColor: "transparent",
    tooltip: { trigger: "axis" },
    grid: { left: 45, right: 20, top: 30, bottom: 25 },
    xAxis: {
      type: "category",
      data: data.monthlyStats?.map((s: any) => s.month) || [],
      axisLine: { lineStyle: { color: "#334155" } },
      axisLabel: { color: "#94a3b8", fontSize: 10, fontFamily: "monospace" },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "#1e293b", type: "dashed" } },
      axisLabel: { color: "#94a3b8", fontSize: 10, fontFamily: "monospace" },
    },
    series: [
      {
        name: "Distance (km)",
        type: "line",
        data: data.monthlyStats?.map((s: any) => s.distanceKm) || [],
        smooth: true,
        lineStyle: { width: 3, color: "#38bdf8" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(56, 189, 248, 0.4)" },
              { offset: 1, color: "rgba(56, 189, 248, 0.0)" },
            ],
          },
        },
      },
    ],
  };

  // Warnings by Category Bar Chart
  const warningsChart = {
    backgroundColor: "transparent",
    tooltip: { trigger: "axis" },
    grid: { left: 45, right: 20, top: 30, bottom: 25 },
    xAxis: {
      type: "category",
      data: data.warningsByCategory?.map((w: any) => w.category) || [],
      axisLine: { lineStyle: { color: "#334155" } },
      axisLabel: { color: "#94a3b8", fontSize: 10, fontFamily: "monospace" },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "#1e293b", type: "dashed" } },
      axisLabel: { color: "#94a3b8", fontSize: 10, fontFamily: "monospace" },
    },
    series: [
      {
        name: "Warnings",
        type: "bar",
        data: data.warningsByCategory?.map((w: any) => w.count) || [],
        itemStyle: { color: "#f59e0b", borderRadius: [4, 4, 0, 0] },
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-sky-400" />
          <span>ADVANCED OPERATIONS ANALYTICS & TREND METRICS</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Historical trend analysis across total fleet airtime, geographic distance covered, and incident patterns.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="text-xs font-mono uppercase text-slate-200 font-bold mb-3 flex items-center justify-between">
            <span>TRAVELED DISTANCE TREND (KM)</span>
            <span className="text-sky-400 text-[10px]">MONTHLY</span>
          </div>
          <ReactECharts option={distanceChart} style={{ height: "240px" }} />
        </div>

        <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="text-xs font-mono uppercase text-slate-200 font-bold mb-3 flex items-center justify-between">
            <span>ANOMALIES & WARNINGS BY CATEGORY</span>
            <span className="text-amber-400 text-[10px]">OCCURRENCES</span>
          </div>
          <ReactECharts option={warningsChart} style={{ height: "240px" }} />
        </div>
      </div>
    </div>
  );
}
