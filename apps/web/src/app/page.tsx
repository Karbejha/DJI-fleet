"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useLanguage } from "@/components/LanguageContext";
import { formatDuration, formatDistance, formatAltitude } from "@/lib/utils";
import ReactECharts from "echarts-for-react";
import {
  Plane,
  Clock,
  Navigation2,
  Cpu,
  BatteryCharging,
  AlertTriangle,
  ShieldAlert,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  UploadCloud,
} from "lucide-react";

export default function DashboardPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .getDashboard()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">LOADING OPERATIONS TELEMETRY...</span>
        </div>
      </div>
    );
  }

  // Monthly Flight Hours Chart Option
  const monthlyChartOption = {
    backgroundColor: "transparent",
    tooltip: { trigger: "axis" },
    grid: { left: 40, right: 20, top: 30, bottom: 25 },
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
        name: "Flight Hours",
        type: "bar",
        data: data.monthlyStats?.map((s: any) => s.flightHours) || [],
        itemStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "#38bdf8" },
              { offset: 1, color: "#0284c7" },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  // Flights by Drone Donut Chart Option
  const droneChartOption = {
    backgroundColor: "transparent",
    tooltip: { trigger: "item" },
    series: [
      {
        name: "Flights by Aircraft",
        type: "pie",
        radius: ["50%", "75%"],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: "#0b1222", borderWidth: 3 },
        label: { show: false },
        data:
          data.flightsByDrone?.map((d: any) => ({
            name: d.nickname || d.model,
            value: d.count,
          })) || [],
      },
    ],
  };

  const kpis = [
    {
      title: t("totalFlights"),
      value: data.totalFlights,
      unit: "missions",
      icon: Plane,
      color: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/20",
    },
    {
      title: t("totalFlightTime"),
      value: `${data.totalFlightTimeHours}h`,
      unit: "airborne",
      icon: Clock,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
    },
    {
      title: t("totalDistance"),
      value: `${data.totalDistanceKm} km`,
      unit: "traveled",
      icon: Navigation2,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: t("activeDrones"),
      value: data.activeDrones,
      unit: "in fleet",
      icon: Cpu,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: t("activeBatteries"),
      value: data.activeBatteries,
      unit: "packs",
      icon: BatteryCharging,
      color: "text-teal-400",
      bg: "bg-teal-500/10 border-teal-500/20",
    },
    {
      title: t("warnings"),
      value: data.totalWarnings,
      unit: "anomalies",
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      title: t("incidentsCount"),
      value: data.totalIncidents,
      unit: "critical",
      icon: ShieldAlert,
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
    },
    {
      title: t("flightsThisMonth"),
      value: data.flightsThisMonth,
      unit: "current cycle",
      icon: Calendar,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 border border-sky-800/30">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>FLIGHT OPERATIONS EXECUTIVE OVERVIEW</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/40">
              LIVE
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time fleet readiness, high-frequency telemetry analytics, and anomaly detection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/imports"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-colors shadow-lg shadow-sky-500/20"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Flight Logs</span>
          </Link>
        </div>
      </div>

      {/* 8 Top KPI Cards (Section 16) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border backdrop-blur flex flex-col justify-between transition-transform hover:-translate-y-0.5 ${kpi.bg}`}
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono uppercase tracking-wider truncate">
                  {kpi.title}
                </span>
                <Icon className={`w-3.5 h-3.5 ${kpi.color}`} />
              </div>
              <div className="mt-2">
                <div className={`text-xl font-bold font-mono ${kpi.color}`}>
                  {kpi.value}
                </div>
                <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                  {kpi.unit}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Grid: Operational Charts & Fleet Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Flight Hours */}
        <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-mono uppercase text-slate-300 font-bold mb-2 flex items-center justify-between">
            <span>FLIGHT HOURS BY MONTH</span>
            <span className="text-[10px] text-sky-400 font-mono">HOURS</span>
          </div>
          <ReactECharts option={monthlyChartOption} style={{ height: "180px" }} />
        </div>

        {/* Flights by Aircraft Model */}
        <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-mono uppercase text-slate-300 font-bold mb-2 flex items-center justify-between">
            <span>FLIGHTS BY AIRCRAFT</span>
            <span className="text-[10px] text-emerald-400 font-mono">DISTRIBUTION</span>
          </div>
          <ReactECharts option={droneChartOption} style={{ height: "180px" }} />
        </div>

        {/* Fleet Operational Alerts (Section 16) */}
        <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono uppercase text-slate-300 font-bold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{t("fleetAlerts")}</span>
            </div>
            <div className="space-y-2.5">
              {data.fleetAlerts?.map((a: any) => (
                <div
                  key={a.id}
                  className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-200">
                    <span className="truncate">{a.title}</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase ${
                        a.severity === "WARNING"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-sky-500/20 text-sky-400"
                      }`}
                    >
                      {a.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {a.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Flights Table (Section 16) */}
      <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-mono font-bold uppercase text-slate-200">
              {t("recentFlights")}
            </span>
          </div>
          <Link
            href="/flights"
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono transition-colors"
          >
            <span>VIEW ALL FLIGHT ARCHIVE</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400 bg-slate-950/40">
                <th className="py-3 px-4">Flight</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Aircraft</th>
                <th className="py-3 px-4">Pilot</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Distance</th>
                <th className="py-3 px-4">Max Altitude</th>
                <th className="py-3 px-4">Health</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {data.recentFlights?.map((flight: any) => (
                <tr
                  key={flight.id}
                  className="hover:bg-slate-900/60 transition-colors group cursor-pointer"
                >
                  <td className="py-3 px-4 font-bold text-sky-400">
                    <Link href={`/flights/${flight.id}`} className="hover:underline flex items-center gap-1.5">
                      <span>{flight.flightNumber}</span>
                      {flight.isDemo && (
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded font-normal">
                          DEMO
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {flight.startedAt ? new Date(flight.startedAt).toLocaleDateString() : "--"}
                  </td>
                  <td className="py-3 px-4 text-slate-200">
                    {flight.drone?.nickname || flight.drone?.model || "DJI Drone"}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {flight.pilot?.fullName || "Operations Pilot"}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {formatDuration(flight.durationSeconds)}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {formatDistance(flight.calculatedDistanceMeters || flight.reportedDistanceMeters)}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {formatAltitude(flight.maxAltitudeMeters)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        (flight.healthScore || 100) >= 90
                          ? "bg-emerald-500/15 text-emerald-400"
                          : (flight.healthScore || 100) >= 75
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-rose-500/15 text-rose-400"
                      }`}
                    >
                      {flight.healthScore ?? 100}/100
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        flight.processingStatus === "COMPLETED"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : flight.processingStatus === "PARTIAL"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {flight.processingStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
