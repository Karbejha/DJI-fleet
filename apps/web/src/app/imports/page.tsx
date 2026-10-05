"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useLanguage } from "@/components/LanguageContext";
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Database,
  Shield,
  FileCode,
  ExternalLink,
} from "lucide-react";

interface UploadItem {
  id: string;
  file: File;
  status: "PENDING" | "UPLOADING" | "PARSING" | "COMPLETED" | "PARTIAL" | "DUPLICATE" | "FAILED";
  progress: number;
  message: string;
  flightId?: string;
  flightNumber?: string;
  sha256?: string;
  inspection?: any;
}

export default function ImportsPage() {
  const { t } = useLanguage();
  const [queue, setQueue] = useState<UploadItem[]>([]);
  const [apiKey, setApiKey] = useState<string>("");
  const [selectedFileForInspect, setSelectedFileForInspect] = useState<any>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: UploadItem[] = Array.from(files).map((f) => ({
      id: `${f.name}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      file: f,
      status: "PENDING",
      progress: 10,
      message: "Queued for processing...",
    }));

    setQueue((prev) => [...newItems, ...prev]);

    // Process each file
    newItems.forEach((item) => {
      processFile(item);
    });
  };

  const processFile = async (item: UploadItem) => {
    updateItem(item.id, { status: "UPLOADING", progress: 30, message: "Calculating SHA-256 and uploading to storage..." });

    try {
      const res = await api.uploadFile(item.file, apiKey);

      if (res.duplicate) {
        updateItem(item.id, {
          status: "DUPLICATE",
          progress: 100,
          message: res.message || "File already exists in platform archive.",
          flightId: res.associatedFlightId,
          flightNumber: res.flightNumber,
          sha256: res.sha256,
        });
        return;
      }

      updateItem(item.id, {
        status: res.status === "COMPLETED" ? "COMPLETED" : "PARTIAL",
        progress: 100,
        message: res.statusReason || "Processed and associated with flight.",
        flightId: res.flightId,
        flightNumber: res.flightNumber,
        sha256: res.sha256,
        inspection: res.inspection,
      });
    } catch (err: any) {
      updateItem(item.id, {
        status: "FAILED",
        progress: 100,
        message: err.message || "Ingestion pipeline error",
      });
    }
  };

  const updateItem = (id: string, patch: Partial<UploadItem>) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-sky-400" />
          <span>FLIGHT INGESTION CENTER & PARSER ORCHESTRATION</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload binary DJI FlightRecords (*.txt), proprietary black-box DAT files (*.DAT), and companion caches.
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="border-2 border-dashed border-slate-700/80 hover:border-sky-500/80 bg-[#0b1222]/80 rounded-2xl p-10 text-center transition-colors cursor-pointer relative"
      >
        <input
          type="file"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-xl shadow-sky-500/10">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200">
              Drag & drop DJI Flight files here, or click to browse
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              Supports: DJIFlightRecord*.txt, *.DAT (DJI_LOG_V3T), companion *.txt_* metadata caches
            </div>
          </div>
        </div>
      </div>

      {/* DJI Server-Side API Key Input (Optional) */}
      <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Shield className="w-4 h-4 text-sky-400 shrink-0" />
          <div>
            <span className="font-semibold text-slate-200">DJI Developer API Key (Optional)</span>
            <span className="text-[11px] text-slate-400 block">
              Required only for decrypting high-frequency telemetry on v13/v14 records. Metadata parses without key.
            </span>
          </div>
        </div>

        <div className="w-full sm:w-80">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter DJI API Key for keychain decryption..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
          />
        </div>
      </div>

      {/* Ingestion Queue */}
      <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>INGESTION PIPELINE QUEUE ({queue.length})</span>
          </span>
          {queue.length > 0 && (
            <button
              onClick={() => setQueue([])}
              className="text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
            >
              Clear Queue
            </button>
          )}
        </div>

        {queue.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">
            Queue is currently empty. Drop files above to begin ingestion.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {queue.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-slate-900/40 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* File info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                    <FileCode className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 font-mono truncate">
                      {item.file.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                      <span>{(item.file.size / 1024).toFixed(0)} KB</span>
                      <span>•</span>
                      <span className="text-slate-300">{item.message}</span>
                    </div>
                  </div>
                </div>

                {/* Status & Action */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase ${
                      item.status === "COMPLETED"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : item.status === "PARTIAL"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        : item.status === "DUPLICATE"
                        ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                        : item.status === "FAILED"
                        ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {item.status}
                  </span>

                  {/* Duplicate link / Associated Flight link */}
                  {item.flightId && (
                    <Link
                      href={`/flights/${item.flightId}`}
                      className="flex items-center gap-1.5 px-3 py-1 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-400 text-xs font-mono font-bold rounded-lg transition-colors"
                    >
                      <span>Open {item.flightNumber || "Flight"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {/* Inspect Details Button */}
                  {item.inspection && (
                    <button
                      onClick={() => setSelectedFileForInspect(item)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg transition-colors"
                    >
                      Inspect
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Inspector Modal (Section 31) */}
      {selectedFileForInspect && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1222] border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-slate-100 font-mono">
                  FILE INSPECTOR & CAPABILITY MATRIX
                </h3>
              </div>
              <button
                onClick={() => setSelectedFileForInspect(null)}
                className="text-slate-400 hover:text-white font-mono text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">FILENAME</span>
                <span className="text-slate-200">{selectedFileForInspect.file.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">SHA-256 FINGERPRINT</span>
                <span className="text-sky-400 break-all">{selectedFileForInspect.sha256}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px]">DETECTED FORMAT</span>
                  <span className="text-slate-200">
                    {selectedFileForInspect.inspection?.file_type}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">LOG VERSION</span>
                  <span className="text-slate-200">
                    {selectedFileForInspect.inspection?.log_version ?? "N/A"}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">PARSER NOTES</span>
                <span className="text-slate-300">
                  {selectedFileForInspect.inspection?.notes || "No notes"}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedFileForInspect(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
