"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { FileText, Printer, Download, Eye } from "lucide-react";

export default function ReportsPage() {
  const [flights, setFlights] = useState<any[]>([]);

  useEffect(() => {
    api.getFlights({ limit: "30" }).then((res) => setFlights(res.items || []));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-sky-400" />
          <span>FLIGHT MISSION BRIEFINGS & REGULATORY REPORTS</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Generate formal printable PDF/HTML post-flight mission briefings and incident audit sheets.
        </p>
      </div>

      <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800">
          <span className="text-xs font-mono font-bold uppercase text-slate-200">
            AVAILABLE FLIGHT REPORTS ({flights.length})
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {flights.map((f) => (
            <div key={f.id} className="p-4 hover:bg-slate-900/40 transition-colors flex items-center justify-between">
              <div>
                <div className="font-mono text-sm font-bold text-sky-400">
                  {f.flightNumber} Briefing Report
                </div>
                <div className="text-xs text-slate-400 mt-0.5 font-mono">
                  Aircraft: {f.drone?.nickname || f.drone?.model} • Date: {new Date(f.startedAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/flights/${f.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <span>View Details</span>
                </Link>
                <button
                  onClick={() => {
                    window.open(`/flights/${f.id}`, "_blank");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-400 text-xs font-mono font-bold rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Dossier</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
