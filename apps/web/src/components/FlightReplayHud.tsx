"use client";

import React, { useState, useEffect, useRef } from "react";
import { TelemetrySample } from "@dji-fleet/shared";
import {
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Battery,
  Wifi,
  Radio,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
} from "lucide-react";

interface FlightReplayHudProps {
  telemetry: TelemetrySample[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export const FlightReplayHud: React.FC<FlightReplayHudProps> = ({
  telemetry,
  currentIndex,
  onIndexChange,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const sample = telemetry[currentIndex] || telemetry[0] || {};
  const maxIndex = Math.max(0, telemetry.length - 1);

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  // Replay animation clock loop
  useEffect(() => {
    if (!isPlaying || telemetry.length <= 1) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const step = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;

      // Advance frames according to speed multiplier
      if (delta >= 100 / playbackSpeed) {
        lastTimeRef.current = time;
        const next = currentIndexRef.current + 1;
        if (next >= maxIndex) {
          setIsPlaying(false);
          onIndexChange(maxIndex);
        } else {
          onIndexChange(next);
        }
      }

      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, playbackSpeed, maxIndex, telemetry.length, onIndexChange]);

  const togglePlay = () => {
    if (currentIndex >= maxIndex) {
      onIndexChange(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    onIndexChange(0);
  };

  const formatSeconds = (sec: number = 0) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const currentSeconds = sample.timeOffsetSec || (sample.timestampMs ? sample.timestampMs / 1000 : 0);
  const totalSeconds = telemetry[maxIndex]?.timeOffsetSec || (telemetry[maxIndex]?.timestampMs ? telemetry[maxIndex].timestampMs / 1000 : 0);

  return (
    <div className="bg-[#0b1222]/95 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur">
      {/* Tactical Glass-Cockpit HUD Indicators (Section 20) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
        {/* 1. Altitude */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>ALTITUDE</span>
            <Layers className="w-3 h-3 text-sky-400" />
          </div>
          <div className="text-lg font-bold font-mono text-sky-400 mt-1">
            {sample.relativeAltitude != null ? `${sample.relativeAltitude.toFixed(1)} m` : "--"}
          </div>
        </div>

        {/* 2. Ground Speed */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>SPEED</span>
            <Gauge className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="text-lg font-bold font-mono text-cyan-400 mt-1">
            {sample.horizontalSpeed != null ? `${sample.horizontalSpeed.toFixed(1)} m/s` : "--"}
          </div>
        </div>

        {/* 3. VSI (Vertical Speed) */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>VSI</span>
            {sample.verticalSpeed && sample.verticalSpeed > 0 ? (
              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-3 h-3 text-rose-400" />
            )}
          </div>
          <div className="text-lg font-bold font-mono text-slate-200 mt-1">
            {sample.verticalSpeed != null ? `${sample.verticalSpeed > 0 ? "+" : ""}${sample.verticalSpeed.toFixed(1)} m/s` : "0.0 m/s"}
          </div>
        </div>

        {/* 4. Battery */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>BATTERY</span>
            <Battery className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
            {sample.batteryPercent != null ? `${Math.round(sample.batteryPercent)}%` : "--"}
          </div>
        </div>

        {/* 5. GPS Satellites */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>SATELLITES</span>
            <Radio className="w-3 h-3 text-amber-400" />
          </div>
          <div className="text-lg font-bold font-mono text-amber-400 mt-1">
            {sample.satellites != null ? `${sample.satellites} Sats` : "--"}
          </div>
        </div>

        {/* 6. RC Signal */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>RC LINK</span>
            <Wifi className="w-3 h-3 text-indigo-400" />
          </div>
          <div className="text-lg font-bold font-mono text-indigo-400 mt-1">
            {sample.rcSignal != null ? `${Math.round(sample.rcSignal)}%` : "--"}
          </div>
        </div>

        {/* 7. Heading */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>HEADING</span>
            <Compass className="w-3 h-3 text-slate-300" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-200 mt-1">
            {sample.heading != null ? `${Math.round(sample.heading)}°` : "--"}
          </div>
        </div>

        {/* 8. Mode */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
          <div className="text-[10px] text-slate-400 font-mono">MODE</div>
          <div className="text-sm font-bold font-mono text-sky-300 mt-2 truncate">
            {sample.flightMode || "GPS"}
          </div>
        </div>
      </div>

      {/* Replay Controls & Scrubber Slider */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-lg bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-lg shadow-sky-500/20 transition-transform active:scale-95"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
          </button>
          <button
            onClick={handleReset}
            className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline Scrubber */}
        <div className="flex-1 w-full flex items-center gap-3">
          <span className="font-mono text-xs text-sky-400 w-12 text-right">
            {formatSeconds(currentSeconds)}
          </span>
          <input
            type="range"
            min={0}
            max={maxIndex}
            value={currentIndex}
            onChange={(e) => onIndexChange(Number(e.target.value))}
            className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
          <span className="font-mono text-xs text-slate-400 w-12">
            {formatSeconds(totalSeconds)}
          </span>
        </div>

        {/* Speed Multiplier (0.25x, 0.5x, 1x, 2x, 4x, 8x) */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
          {[0.5, 1, 2, 4, 8].map((s) => (
            <button
              key={s}
              onClick={() => setPlaybackSpeed(s)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
                playbackSpeed === s
                  ? "bg-sky-500 text-white font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
