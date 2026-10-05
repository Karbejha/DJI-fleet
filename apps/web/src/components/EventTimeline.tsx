"use client";

import React from "react";
import { FlightEvent, EventSeverity, EventCategory } from "@dji-fleet/shared";
import {
  AlertTriangle,
  Info,
  CheckCircle,
  Radio,
  Battery,
  Camera,
  Compass,
  Navigation,
  ShieldAlert,
} from "lucide-react";

interface EventTimelineProps {
  events: FlightEvent[];
  onSelectEvent?: (event: FlightEvent) => void;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({ events, onSelectEvent }) => {
  if (!events || events.length === 0) {
    return (
      <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-6 text-center text-slate-500 font-mono text-xs">
        No anomalous warnings or flight events recorded.
      </div>
    );
  }

  const getCategoryIcon = (cat: EventCategory) => {
    switch (cat) {
      case EventCategory.BATTERY:
        return <Battery className="w-3.5 h-3.5 text-emerald-400" />;
      case EventCategory.GPS:
        return <Radio className="w-3.5 h-3.5 text-amber-400" />;
      case EventCategory.RC:
        return <Navigation className="w-3.5 h-3.5 text-indigo-400" />;
      case EventCategory.CAMERA:
        return <Camera className="w-3.5 h-3.5 text-cyan-400" />;
      case EventCategory.RTH:
        return <Compass className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Info className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  const getSeverityBadge = (sev: EventSeverity) => {
    switch (sev) {
      case EventSeverity.CRITICAL:
        return "bg-rose-500/20 text-rose-400 border border-rose-500/40";
      case EventSeverity.WARNING:
        return "bg-amber-500/20 text-amber-400 border border-amber-500/40";
      case EventSeverity.INFO:
      default:
        return "bg-sky-500/20 text-sky-400 border border-sky-500/40";
    }
  };

  const formatOffset = (sec: number = 0) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `+${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-3">
        CHRONOLOGICAL EVENT LOG ({events.length})
      </div>

      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {events.map((evt) => (
          <div
            key={evt.id}
            onClick={() => onSelectEvent?.(evt)}
            className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors"
          >
            {/* Timestamp Badge */}
            <span className="font-mono text-xs text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-900/60 shrink-0">
              {formatOffset(evt.timeOffsetSec)}
            </span>

            {/* Event Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="shrink-0">{getCategoryIcon(evt.category)}</span>
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {evt.title}
                </span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${getSeverityBadge(
                    evt.severity
                  )}`}
                >
                  {evt.category}
                </span>
              </div>
              {evt.description && (
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {evt.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
