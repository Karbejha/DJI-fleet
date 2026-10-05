"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "./LanguageContext";
import {
  LayoutDashboard,
  Plane,
  Map as MapIcon,
  Cpu,
  BatteryCharging,
  Users,
  Compass,
  AlertTriangle,
  BarChart3,
  UploadCloud,
  FileText,
  Settings,
  Languages,
  Radio,
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { t, language, setLanguage } = useLanguage();

  const navItems = [
    { href: "/", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/flights", label: t("flights"), icon: Plane },
    { href: "/map", label: t("flightMap"), icon: MapIcon },
    { href: "/fleet/drones", label: t("drones"), icon: Cpu },
    { href: "/fleet/batteries", label: t("batteries"), icon: BatteryCharging },
    { href: "/pilots", label: t("pilots"), icon: Users },
    { href: "/missions", label: t("missions"), icon: Compass },
    { href: "/incidents", label: t("incidents"), icon: AlertTriangle },
    { href: "/analytics", label: t("analytics"), icon: BarChart3 },
    { href: "/imports", label: t("imports"), icon: UploadCloud },
    { href: "/reports", label: t("reports"), icon: FileText },
    { href: "/settings", label: t("settings"), icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 select-none z-30">
      <div>
        {/* Brand / Logo */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wider text-slate-100 uppercase">
                DJI FLEET OPS
              </div>
              <div className="text-[10px] text-sky-400 tracking-widest uppercase font-mono">
                TELEMETRY & GIS
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm shadow-sky-500/10 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-sky-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls: Language Switcher & Operational Status */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between mb-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-slate-300 font-mono">SYSTEM ONLINE</span>
          </span>
          <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
            v1.0.0
          </span>
        </div>

        {/* Language switch button */}
        <button
          onClick={() => setLanguage(language === "en" ? "ar" : "en")}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs text-slate-200 transition-colors font-mono"
        >
          <Languages className="w-3.5 h-3.5 text-sky-400" />
          <span>{language === "en" ? "العربية (RTL)" : "English (LTR)"}</span>
        </button>
      </div>
    </aside>
  );
};
