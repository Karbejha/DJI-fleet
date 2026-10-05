"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import { TelemetrySample } from "@dji-fleet/shared";

interface TelemetryChartsProps {
  telemetry: TelemetrySample[];
  currentIndex: number;
  onIndexSelect: (index: number) => void;
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({
  telemetry,
  currentIndex,
  onIndexSelect,
}) => {
  if (!telemetry || telemetry.length === 0) {
    return (
      <div className="bg-[#0b1222] border border-slate-800 rounded-xl p-8 text-center text-slate-500 font-mono text-xs">
        No high-frequency telemetry samples available for this flight log.
      </div>
    );
  }

  const times = telemetry.map((s, i) => {
    const sec = s.timeOffsetSec != null ? s.timeOffsetSec : s.timestampMs ? s.timestampMs / 1000 : i * 0.1;
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  });

  const altitudes = telemetry.map((s) => s.relativeAltitude ?? 0);
  const speeds = telemetry.map((s) => s.horizontalSpeed ?? 0);
  const vSpeeds = telemetry.map((s) => s.verticalSpeed ?? 0);
  const batteryPcts = telemetry.map((s) => s.batteryPercent ?? 0);
  const batteryVolts = telemetry.map((s) => s.batteryVoltage ?? 0);
  const batteryTemps = telemetry.map((s) => s.batteryTemperature ?? 0);
  const satellites = telemetry.map((s) => s.satellites ?? 0);
  const rcSignals = telemetry.map((s) => s.rcSignal ?? 0);

  // Common dark theme chart styling
  const commonOptions = {
    backgroundColor: "transparent",
    animation: false,
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "#334155",
      textStyle: { color: "#f8fafc", fontSize: 11, fontFamily: "monospace" },
      axisPointer: {
        type: "cross",
        label: { backgroundColor: "#0284c7" },
        lineStyle: { color: "#38bdf8", width: 1, type: "dashed" },
      },
    },
    grid: { left: 45, right: 35, top: 35, bottom: 25 },
    xAxis: {
      type: "category",
      data: times,
      axisLine: { lineStyle: { color: "#334155" } },
      axisLabel: { color: "#94a3b8", fontSize: 10, fontFamily: "monospace" },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "#1e293b", type: "dashed" } },
      axisLabel: { color: "#94a3b8", fontSize: 10, fontFamily: "monospace" },
    },
  };

  // Altitude & Speed Option
  const altSpeedOption = {
    ...commonOptions,
    title: {
      text: "ALTITUDE & SPEEDS",
      textStyle: { color: "#38bdf8", fontSize: 11, fontWeight: "bold", fontFamily: "monospace" },
    },
    legend: {
      data: ["Altitude (m)", "Speed (m/s)", "VSI (m/s)"],
      textStyle: { color: "#94a3b8", fontSize: 10 },
      right: 10,
    },
    series: [
      {
        name: "Altitude (m)",
        type: "line",
        data: altitudes,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: "#38bdf8" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(56, 189, 248, 0.3)" },
              { offset: 1, color: "rgba(56, 189, 248, 0.0)" },
            ],
          },
        },
      },
      {
        name: "Speed (m/s)",
        type: "line",
        data: speeds,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.5, color: "#22d3ee" },
      },
      {
        name: "VSI (m/s)",
        type: "line",
        data: vSpeeds,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1, color: "#a855f7" },
      },
    ],
  };

  // Battery Profile Option
  const batteryOption = {
    ...commonOptions,
    title: {
      text: "BATTERY DRAIN & THERMALS",
      textStyle: { color: "#10b981", fontSize: 11, fontWeight: "bold", fontFamily: "monospace" },
    },
    legend: {
      data: ["Charge (%)", "Voltage (V)", "Temp (°C)"],
      textStyle: { color: "#94a3b8", fontSize: 10 },
      right: 10,
    },
    series: [
      {
        name: "Charge (%)",
        type: "line",
        data: batteryPcts,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: "#10b981" },
      },
      {
        name: "Voltage (V)",
        type: "line",
        data: batteryVolts,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.5, color: "#f59e0b" },
      },
      {
        name: "Temp (°C)",
        type: "line",
        data: batteryTemps,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.5, color: "#ef4444" },
      },
    ],
  };

  // RF Signals & Satellites Option
  const rfOption = {
    ...commonOptions,
    title: {
      text: "SATELLITES & RC SIGNAL LINK",
      textStyle: { color: "#818cf8", fontSize: 11, fontWeight: "bold", fontFamily: "monospace" },
    },
    legend: {
      data: ["RC Signal (%)", "Satellites"],
      textStyle: { color: "#94a3b8", fontSize: 10 },
      right: 10,
    },
    series: [
      {
        name: "RC Signal (%)",
        type: "line",
        data: rcSignals,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: "#818cf8" },
      },
      {
        name: "Satellites",
        type: "line",
        data: satellites,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.5, color: "#fbbf24" },
      },
    ],
  };

  const onChartClick = (params: any) => {
    if (params && params.dataIndex != null) {
      onIndexSelect(params.dataIndex);
    }
  };

  return (
    <div className="space-y-4">
      {/* Chart 1: Altitude & Speeds */}
      <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-3">
        <ReactECharts
          option={altSpeedOption}
          style={{ height: "200px", width: "100%" }}
          onEvents={{ click: onChartClick }}
        />
      </div>

      {/* Chart 2: Battery & Thermals */}
      <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-3">
        <ReactECharts
          option={batteryOption}
          style={{ height: "200px", width: "100%" }}
          onEvents={{ click: onChartClick }}
        />
      </div>

      {/* Chart 3: Satellites & Signal */}
      <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-3">
        <ReactECharts
          option={rfOption}
          style={{ height: "200px", width: "100%" }}
          onEvents={{ click: onChartClick }}
        />
      </div>
    </div>
  );
};
