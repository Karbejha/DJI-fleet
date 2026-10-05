"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Compass, CheckCircle2, Clock, MapPin } from "lucide-react";

export default function MissionsPage() {
  const [missions, setMissions] = useState<any[]>([]);

  useEffect(() => {
    api.getMissions().then((res) => setMissions(res || []));
  }, []);

  const defaultMissions = [
    {
      id: "m-01",
      name: "Perimeter Security & Perimeter Sweep",
      department: "Security & Surveillance",
      location: "Industrial Sector 4",
      status: "COMPLETED",
      flightsCount: 6,
    },
    {
      id: "m-02",
      name: "High-Voltage Powerline Inspection",
      department: "Infrastructure Audit",
      location: "Northern Transmission Corridor",
      status: "IN_PROGRESS",
      flightsCount: 4,
    },
    {
      id: "m-03",
      name: "Agricultural Multispectral Survey",
      department: "GIS & Photogrammetry",
      location: "East Basin Farmland",
      status: "PLANNED",
      flightsCount: 0,
    },
  ];

  const displayList = missions.length > 0 ? missions : defaultMissions;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Compass className="w-5 h-5 text-sky-400" />
          <span>OPERATIONAL MISSIONS & FLIGHT TASKS</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Group multiple flights under organizational missions, geofenced sectors, and objective logs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {displayList.map((m) => (
          <div
            key={m.id}
            className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="text-sm font-bold text-slate-100 font-mono">{m.name}</div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  {m.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs font-mono text-slate-300">
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>{m.location || "Operations Zone"}</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Department: <span className="text-slate-200">{m.department}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>{m.flightsCount || 2} Associated Flights</span>
              <span className="text-sky-400 cursor-pointer hover:underline">Inspect →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
