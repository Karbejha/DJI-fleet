"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useLanguage } from "@/components/LanguageContext";
import { formatDuration, formatDistance } from "@/lib/utils";
import { Cpu, Plane, Clock, Navigation, ShieldCheck, AlertTriangle } from "lucide-react";

export default function FleetDronesPage() {
  const { t } = useLanguage();
  const [drones, setDrones] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api
      .getDrones()
      .then((res) => {
        setDrones(res || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Drones fetch error:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-sky-400" />
          <span>AIRCRAFT FLEET INVENTORY & HARDWARE ASSETS</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Registered unmanned aerial vehicles, flight hour airworthiness tracking, and maintenance logs.
        </p>
      </div>

      {/* Drones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {drones.map((drone) => (
          <div
            key={drone.id}
            className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Drone Card Top */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-100 font-mono">
                    {drone.nickname || drone.model}
                  </div>
                  <div className="text-xs text-sky-400 mt-0.5 font-mono">
                    {drone.model}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    drone.status === "ACTIVE"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {drone.status}
                </span>
              </div>

              {/* Serial Number */}
              <div className="mt-3 p-2 bg-slate-900/80 rounded-lg border border-slate-800/80 font-mono text-[11px] text-slate-400 flex items-center justify-between">
                <span>SERIAL:</span>
                <span className="text-slate-200 font-bold">{drone.serialNumber}</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mt-4 text-center font-mono">
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">FLIGHTS</div>
                  <div className="text-sm font-bold text-slate-100 mt-1">
                    {drone.totalFlightCount}
                  </div>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">HOURS</div>
                  <div className="text-sm font-bold text-sky-400 mt-1">
                    {(drone.totalFlightTimeSeconds / 3600).toFixed(1)}h
                  </div>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">DISTANCE</div>
                  <div className="text-sm font-bold text-indigo-400 mt-1">
                    {formatDistance(drone.totalDistanceMeters)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Last Flight: {drone.lastFlightAt ? new Date(drone.lastFlightAt).toLocaleDateString() : "--"}</span>
              <Link
                href={`/flights?droneId=${drone.id}`}
                className="text-sky-400 hover:text-sky-300 transition-colors"
              >
                View Flights →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
