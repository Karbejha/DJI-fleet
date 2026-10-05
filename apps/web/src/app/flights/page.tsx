"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useLanguage } from "@/components/LanguageContext";
import { formatDuration, formatDistance, formatAltitude, formatSpeed } from "@/lib/utils";
import {
  Plane,
  Search,
  Filter,
  Download,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Battery,
} from "lucide-react";

export default function FlightsPage() {
  const { t } = useLanguage();
  const [flights, setFlights] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const fetchFlights = () => {
    setLoading(true);
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    };
    if (searchQuery) params.q = searchQuery;
    if (selectedStatus) params.status = selectedStatus;

    api
      .getFlights(params)
      .then((res) => {
        setFlights(res.items || []);
        setTotal(res.total || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Flights fetch error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFlights();
  }, [page, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchFlights();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Plane className="w-5 h-5 text-sky-400" />
            <span>FLIGHT ARCHIVE & HISTORICAL RECORDS</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, and inspect all ingested DJI flight logs across your fleet.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/imports"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-colors shadow-lg shadow-sky-500/20"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Flights</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar (Section 17) */}
      <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by flight number, drone serial, battery serial, or pilot..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-24 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded font-medium transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PARTIAL">Partial (Header Only)</option>
            <option value="UNSUPPORTED">Unsupported</option>
          </select>
        </div>
      </div>

      {/* Flight Table */}
      <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400 bg-slate-950/40">
                <th className="py-3.5 px-4">Flight</th>
                <th className="py-3.5 px-4">Date / Time</th>
                <th className="py-3.5 px-4">Aircraft</th>
                <th className="py-3.5 px-4">Pilot</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Distance</th>
                <th className="py-3.5 px-4">Max Alt</th>
                <th className="py-3.5 px-4">Top Speed</th>
                <th className="py-3.5 px-4">Battery</th>
                <th className="py-3.5 px-4">Health</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500 font-mono text-xs">
                    LOADING FLIGHT ARCHIVE...
                  </td>
                </tr>
              ) : flights.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500 font-mono text-xs">
                    No flight records match your query.
                  </td>
                </tr>
              ) : (
                flights.map((flight) => (
                  <tr
                    key={flight.id}
                    className="hover:bg-slate-900/60 transition-colors group cursor-pointer"
                  >
                    <td className="py-3 px-4 font-bold text-sky-400">
                      <Link
                        href={`/flights/${flight.id}`}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        <span>{flight.flightNumber}</span>
                        {flight.isDemo && (
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded font-normal">
                            DEMO
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {flight.startedAt ? new Date(flight.startedAt).toLocaleString() : "--"}
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
                      {formatDistance(
                        flight.calculatedDistanceMeters || flight.reportedDistanceMeters
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {formatAltitude(flight.maxAltitudeMeters)}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {formatSpeed(flight.maxHorizontalSpeed)}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {flight.battery?.serialNumber ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                          <Battery className="w-3 h-3" />
                          {flight.battery.serialNumber.slice(-6)}
                        </span>
                      ) : (
                        "--"
                      )}
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div>
            Showing <span className="text-slate-200">{flights.length}</span> of{" "}
            <span className="text-slate-200">{total}</span> flights
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
