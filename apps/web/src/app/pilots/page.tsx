"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Users, Shield, Award, Clock, Plane } from "lucide-react";

export default function PilotsPage() {
  const [pilots, setPilots] = useState<any[]>([]);

  useEffect(() => {
    api.getPilots().then((res) => setPilots(res || []));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-sky-400" />
          <span>FLIGHT CREW & CERTIFIED PILOTS ROSTER</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Certified remote pilots in command (PIC), operational flight hours, and mission rosters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pilots.map((p) => (
          <div
            key={p.id}
            className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-950/60 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold font-mono text-xs">
                  {p.fullName.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-200">{p.fullName}</div>
                  <div className="text-[11px] text-sky-400 font-mono">{p.licenseNumber}</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs font-mono text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">DEPARTMENT:</span>
                  <span className="text-slate-200">{p.departmentName || "Flight Operations"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">TOTAL FLIGHTS:</span>
                  <span className="text-emerald-400 font-bold">{p.totalFlights}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">AIRBORNE TIME:</span>
                  <span className="text-sky-400 font-bold">{(p.totalFlightTimeSeconds / 3600).toFixed(1)}h</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <Shield className="w-3 h-3" /> ACTIVE PIC
              </span>
              <span>{p.phone}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
