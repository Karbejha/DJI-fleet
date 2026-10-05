import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageContext";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "DJI Drone Fleet & Flight Analytics Platform",
  description:
    "Production-grade enterprise platform for DJI drone fleet management, high-frequency flight telemetry analysis, PostGIS GIS spatial tracking, and incident forensics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#080c14] text-slate-100 min-h-screen flex antialiased">
        <LanguageProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 min-h-screen">
            <Header />
            <main className="flex-1 p-6 overflow-y-auto">{children}</main>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
