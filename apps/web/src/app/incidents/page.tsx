"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AlertTriangle, ShieldAlert, ArrowRight, Radio, Battery, Navigation, Clock } from "lucide-react";

export default function IncidentsPage() {
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFlights({ limit: "50" }).then((res) => {
      setFlights(res.items || []);
      setLoading(false);
    });
  }, []);

  // Filter flights with warnings or health < 90
  const incidentFlights = flights.filter((f) => (f.warningCount || 0) > 0 || (f.healthScore || 100) < 95);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span>INCIDENT INVESTIGATION & ANOMALOUS FLIGHTS</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Rule-based anomaly detection log: RC signal dropouts, GPS quality degradation, battery cell imbalance, and high sink rates.
        </p>
      </div>

      <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase text-slate-200">
            DETECTED ANOMALIES & DEDUCTIONS ({incidentFlights.length} FLIGHTS)
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-mono text-xs">
              ANALYZING INCIDENTS...
            </div>
          ) : incidentFlights.length === 0 ? (
            <div className="p-12 text-center text-emerald-400 font-mono text-xs">
              Zero active incidents or safety warnings detected across recorded flights.
            </div>
          ) : (
            incidentFlights.map((flight) => (
              <div key={flight.id} className="p-4 hover:bg-slate-900/40 transition-colors flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-sky-400">
                      {flight.flightNumber}
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">
                      {flight.drone?.nickname || flight.drone?.model}
                    </span>
                    <span className="text-[10px] bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded font-mono font-bold">
                      HEALTH: {flight.healthScore ?? 100}/100
                    </span>
                  </div>

                  {flight.healthBreakdown?.deductions && flight.healthBreakdown.deductions.length > 0 && (
                    <div className="text-xs text-slate-400 mt-1 space-y-1">
                      {flight.healthBreakdown.deductions.map((d: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-rose-400 font-mono font-bold">-{d.points}</span>
                          <span className="text-slate-300">[{d.category}] {d.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  href={`/flights/${flight.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg transition-colors shrink-0"
                >
                  <span>Investigate</span>
                  <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
