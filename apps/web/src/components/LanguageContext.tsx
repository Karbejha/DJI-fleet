"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "ar";
export type Direction = "ltr" | "rtl";

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    appName: "DJI Fleet & Flight Analytics",
    dashboard: "Dashboard",
    flights: "Flights",
    flightMap: "Flight Map",
    fleet: "Fleet",
    drones: "Drones",
    batteries: "Batteries",
    controllers: "Controllers",
    cameras: "Cameras",
    pilots: "Pilots",
    missions: "Missions",
    incidents: "Incidents & Warnings",
    analytics: "Analytics",
    imports: "Import Center",
    reports: "Reports",
    settings: "Settings",

    // KPI Cards
    totalFlights: "Total Flights",
    totalFlightTime: "Total Flight Time",
    totalDistance: "Total Distance",
    activeDrones: "Active Aircraft",
    activeBatteries: "Active Batteries",
    warnings: "Warnings",
    incidentsCount: "Incidents",
    flightsThisMonth: "Flights This Month",
    fleetAlerts: "Fleet Operational Alerts",
    recentFlights: "Recent Flights",

    // Flight detail
    flightDetails: "Flight Details",
    duration: "Duration",
    distance: "Distance",
    maxAltitude: "Max Altitude",
    maxSpeed: "Max Speed",
    takeoff: "Takeoff",
    landing: "Landing",
    status: "Status",
    healthScore: "Health Score",
    playback: "Flight Replay",
    telemetryCharts: "Telemetry Charts",
    eventsTimeline: "Event Timeline",
    exportCsv: "Export CSV",
    exportGeoJson: "Export GeoJSON",
    exportKml: "Export KML",
    printReport: "Flight Report",
    colorTrackBy: "Color Track By",
    altitude: "Altitude",
    speed: "Speed",
    battery: "Battery",
    signal: "RC Signal",
    flightMode: "Flight Mode",

    // Replay
    play: "Play",
    pause: "Pause",
    speedMultiplier: "Playback Speed",

    // Imports
    uploadTitle: "Upload DJI Flight Logs",
    uploadSubtitle: "Drag & drop DJIFlightRecord (*.txt), DAT (*.DAT), or companion metadata files",
    analyzing: "Analyzing",
    completed: "Completed",
    partial: "Partial",
    failed: "Failed",
    unsupported: "Unsupported",
  },
  ar: {
    appName: "منصة إدارة وتحليلات أسطول مسيرات DJI",
    dashboard: "لوحة العمليات",
    flights: "الرحلات الجوية",
    flightMap: "خريطة الرحلات",
    fleet: "الأسطول",
    drones: "المسيرات (الدرونز)",
    batteries: "البطاريات",
    controllers: "أجهزة التحكم",
    cameras: "الكاميرات والمحاور",
    pilots: "الطيارون",
    missions: "المهام الميدانية",
    incidents: "البلاغات والتحذيرات",
    analytics: "التحليلات المتقدمة",
    imports: "مركز الاستيراد",
    reports: "التقارير الميدانية",
    settings: "الإعدادات",

    // KPI Cards
    totalFlights: "إجمالي الرحلات",
    totalFlightTime: "ساعات الطيران الكلية",
    totalDistance: "المسافة الكلية المقطوعة",
    activeDrones: "المسيرات النشطة",
    activeBatteries: "البطاريات الجاهزة",
    warnings: "التنبيهات التشغيلية",
    incidentsCount: "الحوادث الحرجة",
    flightsThisMonth: "رحلات الشهر الحالي",
    fleetAlerts: "تنبيهات سلامة الأسطول",
    recentFlights: "أحدث الرحلات المسجلة",

    // Flight detail
    flightDetails: "تفاصيل الرحلة",
    duration: "مدة الرحلة",
    distance: "المسافة",
    maxAltitude: "أقصى ارتفاع",
    maxSpeed: "أقصى سرعة",
    takeoff: "الإقلاع",
    landing: "الهبوط",
    status: "الحالة",
    healthScore: "مؤشر سلامة الرحلة",
    playback: "محاكي إعادة الرحلة",
    telemetryCharts: "مخططات القياس عن بعد",
    eventsTimeline: "سجل الأحداث الزمني",
    exportCsv: "تصدير CSV",
    exportGeoJson: "تصدير GeoJSON",
    exportKml: "تصدير KML (Google Earth)",
    printReport: "تقرير الرحلة",
    colorTrackBy: "تلوين المسار حسب",
    altitude: "الارتفاع",
    speed: "السرعة",
    battery: "شحن البطارية",
    signal: "إشارة التحكم",
    flightMode: "نمط الطيران",

    // Replay
    play: "تشغيل",
    pause: "إيقاف مؤقت",
    speedMultiplier: "سرعة المحاكاة",

    // Imports
    uploadTitle: "استيراد سجلات طيران DJI",
    uploadSubtitle: "اسحب وأفلت ملفات FlightRecord (.txt) أو DAT أو ملفات بيانات المعايرة المرافقة",
    analyzing: "جارٍ التحليل والفك",
    completed: "مكتمل بالكامل",
    partial: "تحليل جزئي (بيانات أساسية)",
    failed: "فشل التحليل",
    unsupported: "غير مدعوم حالياً",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  direction: "ltr",
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en");
  const direction: Direction = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [direction, language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
