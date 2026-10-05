"use client";

import React, { useState, useEffect } from "react";
import { Search, Bell, Shield, Radio } from "lucide-react";
import { useLanguage } from "./LanguageContext";

export const Header: React.FC = () => {
  const { language } = useLanguage();
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toUTCString().replace("GMT", "UTC") + " | " + now.toLocaleTimeString()
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 px-6 border-b border-slate-800 bg-[#090d18]/90 backdrop-blur sticky top-0 z-20 flex items-center justify-between">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              language === "en"
                ? "Search flight #, drone serial, pilot, or filename..."
                : "بحث برقم الرحلة، الرقم التسلسلي، الطيار..."
            }
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Operations Info & Clock */}
      <div className="flex items-center gap-5">
        <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span>{timeStr || "SYSTEM CLOCK"}</span>
        </div>

        {/* User profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-sky-900/40 border border-sky-500/40 flex items-center justify-center text-sky-300 font-bold text-xs">
            OP
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-semibold text-slate-200">
              Operations Admin
            </div>
            <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <Shield className="w-3 h-3" /> SUPER_ADMIN
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
