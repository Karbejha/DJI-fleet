"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useLanguage } from "@/components/LanguageContext";
import { formatDuration, formatDistance, formatAltitude, formatSpeed } from "@/lib/utils";
import { FlightMap } from "@/components/FlightMap";
import { FlightReplayHud } from "@/components/FlightReplayHud";
import { TelemetryCharts } from "@/components/TelemetryCharts";
import { EventTimeline } from "@/components/EventTimeline";
import { HealthScoreCard } from "@/components/HealthScoreCard";
import {
  Plane,
  Calendar,
  Clock,
  Navigation,
  Gauge,
  Layers,
  Battery,
  ShieldCheck,
  AlertTriangle,
  Download,
  FileText,
  ArrowLeft,
  Info,
  RotateCcw,
} from "lucide-react";

export default function FlightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const flightId = resolvedParams.id;
  const { t } = useLanguage();

  const [flight, setFlight] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronized replay index state across Map, HUD, and Charts
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [colorMode, setColorMode] = useState<"altitude" | "speed" | "battery" | "signal">("altitude");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getFlight(flightId),
      api.getFlightTelemetry(flightId, "all"),
      api.getFlightEvents(flightId),
    ])
      .then(([fRes, tRes, eRes]) => {
        setFlight(fRes);
        setTelemetry(tRes.samples || []);
        setEvents(eRes || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Flight details fetch error:", err);
        setError(err.message || "Failed to load flight");
        setLoading(false);
      });
  }, [flightId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">LOADING 3D FLIGHT TELEMETRY & REPLAY...</span>
        </div>
      </div>
    );
  }

  if (error || !flight) {
    return (
      <div className="p-8 text-center bg-[#0b1222] border border-slate-800 rounded-xl">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-200">Flight Record Not Found</h2>
        <p className="text-xs text-slate-400 mt-1">{error}</p>
        <Link
          href="/flights"
          className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Flights
        </Link>
      </div>
    );
  }

  const exportUrl = (format: string) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
    return `${apiBase}/flights/${flight.id}/export/${format}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/flights"
            className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
                {flight.flightNumber}
              </h1>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                  flight.processingStatus === "COMPLETED"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : flight.processingStatus === "PARTIAL"
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {flight.processingStatus}
              </span>
              {flight.isDemo && (
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                  DEMO DATA
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
              <span className="text-sky-400 font-semibold">
                {flight.drone?.nickname || flight.drone?.model || "DJI Aircraft"}
              </span>
              <span>•</span>
              <span>
                {flight.startedAt
                  ? new Date(flight.startedAt).toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "--"}
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Format Export Buttons (Section 32 & 33) */}
        <div className="flex items-center gap-2">
          <a
            href={exportUrl("csv")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>CSV</span>
          </a>
          <a
            href={exportUrl("geojson")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>GeoJSON</span>
          </a>
          <a
            href={exportUrl("kml")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>KML (Earth)</span>
          </a>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-semibold shadow-lg shadow-sky-500/20 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Flight Header Stats Bar (Section 18) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-[#0b1222]/90 border border-slate-800 p-3 rounded-xl">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Airborne Time</span>
            <Clock className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-base font-bold font-mono text-slate-100 mt-1">
            {formatDuration(flight.durationSeconds)}
          </div>
        </div>

        <div className="bg-[#0b1222]/90 border border-slate-800 p-3 rounded-xl">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Traveled Distance</span>
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-base font-bold font-mono text-slate-100 mt-1">
            {formatDistance(flight.calculatedDistanceMeters || flight.reportedDistanceMeters)}
          </div>
        </div>

        <div className="bg-[#0b1222]/90 border border-slate-800 p-3 rounded-xl">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Max Altitude</span>
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-base font-bold font-mono text-slate-100 mt-1">
            {formatAltitude(flight.maxAltitudeMeters)}
          </div>
        </div>

        <div className="bg-[#0b1222]/90 border border-slate-800 p-3 rounded-xl">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Max Speed</span>
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base font-bold font-mono text-slate-100 mt-1">
            {formatSpeed(flight.maxHorizontalSpeed)}
          </div>
        </div>

        <div className="bg-[#0b1222]/90 border border-slate-800 p-3 rounded-xl">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Battery Pack</span>
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-sm font-bold font-mono text-emerald-400 mt-1 truncate">
            {flight.battery?.serialNumber ? flight.battery.serialNumber.slice(-8) : "Standard"}
          </div>
        </div>

        <div className="bg-[#0b1222]/90 border border-slate-800 p-3 rounded-xl">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Pilot In Command</span>
            <Plane className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-slate-200 mt-1 truncate">
            {flight.pilot?.fullName || "Assigned Pilot"}
          </div>
        </div>
      </div>

      {/* Partial Decryption Notice if Applicable (Section 8) */}
      {flight.processingStatus === "PARTIAL" && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block text-amber-300">
              DJI FlightRecord Partial Decryption Status
            </strong>
            <p className="mt-0.5 text-amber-200/90 leading-relaxed">
              {flight.processingNotes}
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Interactive Map & Replay HUD (Left) + Health & Events (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Map & Replay HUD */}
        <div className="lg:col-span-2 space-y-4">
          {/* Map Container */}
          <div className="h-[460px] w-full">
            <FlightMap
              telemetry={telemetry}
              takeoffLocation={flight.takeoffLocation}
              landingLocation={flight.landingLocation}
              homeLocation={flight.homeLocation}
              currentSampleIndex={currentIndex}
              colorMode={colorMode}
            />
          </div>

          {/* Replay Controls & Tactical Glass Cockpit HUD (Section 20) */}
          <FlightReplayHud
            telemetry={telemetry}
            currentIndex={currentIndex}
            onIndexChange={setCurrentIndex}
          />
        </div>

        {/* Right Column (1 Col): Health Score & Event Timeline */}
        <div className="space-y-4">
          {/* Transparent Flight Health Score (Section 23) */}
          <HealthScoreCard
            healthBreakdown={flight.healthBreakdown}
            healthScore={flight.healthScore}
          />

          {/* Chronological Event Timeline (Section 22) */}
          <EventTimeline
            events={events}
            onSelectEvent={(evt) => {
              // Jump replay to event timestamp
              const idx = telemetry.findIndex((s) => s.timestampMs >= evt.timestampMs);
              if (idx !== -1) setCurrentIndex(idx);
            }}
          />
        </div>
      </div>

      {/* Synchronized Telemetry Charts (Section 21) */}
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase text-slate-300 font-bold tracking-wider flex items-center justify-between">
          <span>HIGH-FREQUENCY TELEMETRY STREAM (SYNCHRONIZED WITH MAP & HUD)</span>
          <span className="text-[10px] text-sky-400 font-mono">
            {telemetry.length} SAMPLES
          </span>
        </div>
        <TelemetryCharts
          telemetry={telemetry}
          currentIndex={currentIndex}
          onIndexSelect={setCurrentIndex}
        />
      </div>
    </div>
  );
}
