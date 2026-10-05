"use client";

import React, { useState } from "react";
import { Settings as SettingsIcon, Shield, Server, FileCode, CheckCircle2, HardDrive } from "lucide-react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-sky-400" />
          <span>PLATFORM CONFIGURATION & SYSTEM ARCHITECTURE</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage DJI decryption credentials, object storage parameters, and microservice status.
        </p>
      </div>

      {/* Services Health Matrix */}
      <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <h2 className="text-sm font-bold font-mono uppercase text-slate-200 flex items-center gap-2">
          <Server className="w-4 h-4 text-sky-400" />
          <span>SERVICES TOPOLOGY & RUNTIME STATUS</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">NestJS API</div>
              <div className="text-[10px] text-slate-400 font-mono">Port 4000</div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">Python Parser</div>
              <div className="text-[10px] text-slate-400 font-mono">FastAPI / pydjirecord</div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">PostGIS Spatial DB</div>
              <div className="text-[10px] text-slate-400 font-mono">PostgreSQL 16</div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">MinIO / S3</div>
              <div className="text-[10px] text-slate-400 font-mono">Immutable Object Storage</div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* DJI API Key Secrets Config */}
      <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold font-mono uppercase text-slate-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-400" />
              <span>DJI DEVELOPER API CREDENTIALS</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Credentials are used exclusively server-side for retrieving AES keychain points for FlightRecord V13 & V14 logs.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">
              DJI API KEY (SERVER-SIDE SECRETS)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="e.g. dji_sec_live_9f847293b6e1..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500 font-mono">
              Note: If left empty, parser operates in header-only PARTIAL mode.
            </span>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-semibold shadow-lg shadow-sky-500/20 transition-colors"
            >
              {saved ? "Saved Securely" : "Save Credentials"}
            </button>
          </div>
        </form>
      </div>

      {/* Pluggable Parsers Capability Matrix */}
      <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <h2 className="text-sm font-bold font-mono uppercase text-slate-200 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-sky-400" />
          <span>PLUGGABLE PARSER CAPABILITY MATRIX (SECTION 30)</span>
        </h2>

        <div className="divide-y divide-slate-800/80 text-xs font-mono">
          <div className="py-2.5 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-200">DJIFlightRecordParser</div>
              <div className="text-[11px] text-slate-400">DJIFlightRecord*.txt (V1 to V14)</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
              GPS, IMU, BATTERY, RC, EVENTS
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-200">DJICompanionMetadataParser</div>
              <div className="text-[11px] text-slate-400">DJIFlightRecord*.txt_&lt;size&gt; (si_cache)</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold">
              UUID, SERIALS, HARDWARE PAIRING
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-200">DJIDatParser</div>
              <div className="text-[11px] text-slate-400">*.DAT (Signature: DJI_LOG_V3T)</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">
              RAW ARCHIVAL, FORENSIC FINGERPRINT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
