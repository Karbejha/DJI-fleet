"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import maplibregl from "maplibre-gl";
import { api } from "@/lib/api";
import { useLanguage } from "@/components/LanguageContext";
import { Map as MapIcon, Filter, Layers, Navigation, Plane, ArrowRight } from "lucide-react";

export default function GlobalMapPage() {
  const { t } = useLanguage();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [tracks, setTracks] = useState<any[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mapStyle, setMapStyle] = useState<"dark" | "satellite">("dark");

  useEffect(() => {
    api
      .getMapTracks()
      .then((res) => {
        setTracks(res || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Map tracks fetch error:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!mapContainer.current || tracks.length === 0) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style:
        mapStyle === "satellite"
          ? {
              version: 8,
              sources: {
                "sat-tiles": {
                  type: "raster",
                  tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
                  tileSize: 256,
                },
              },
              layers: [{ id: "sat-layer", type: "raster", source: "sat-tiles" }],
            }
          : {
              version: 8,
              sources: {
                "dark-tiles": {
                  type: "raster",
                  tiles: ["https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"],
                  tileSize: 256,
                },
              },
              layers: [{ id: "dark-layer", type: "raster", source: "dark-tiles" }],
            } as any,
      center: [36.7368, 36.0041],
      zoom: 13,
      pitch: 35,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      // Add each flight track as a distinct layer
      tracks.forEach((item, idx) => {
        const sourceId = `track-${item.flightId}`;
        if (!item.track || !item.track.geometry) return;

        map.addSource(sourceId, {
          type: "geojson",
          data: item.track,
        });

        // Color variation per aircraft
        const colors = ["#38bdf8", "#10b981", "#a855f7", "#f59e0b", "#ec4899"];
        const color = colors[idx % colors.length];

        map.addLayer({
          id: `line-${sourceId}`,
          type: "line",
          source: sourceId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": color,
            "line-width": 3,
            "line-opacity": 0.85,
          },
        });

        // Click on track opens preview
        map.on("click", `line-${sourceId}`, () => {
          setSelectedFlight(item);
        });
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [tracks, mapStyle]);

  return (
    <div className="space-y-4 h-[calc(100vh-7rem)] flex flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-sky-400" />
            <span>GLOBAL FLEET OPERATIONS MAP</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            PostGIS spatial visualization of multi-drone operational sectors and flight corridors.
          </p>
        </div>

        {/* Style Toggles */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setMapStyle("dark")}
            className={`px-3 py-1 rounded font-medium ${
              mapStyle === "dark" ? "bg-sky-500 text-white" : "text-slate-400"
            }`}
          >
            Aviation Dark
          </button>
          <button
            onClick={() => setMapStyle("satellite")}
            className={`px-3 py-1 rounded font-medium ${
              mapStyle === "satellite" ? "bg-sky-500 text-white" : "text-slate-400"
            }`}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* Main Map Canvas */}
      <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-800 bg-[#090e1a]">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Selected Flight Floating Card */}
        {selectedFlight && (
          <div className="absolute bottom-6 left-6 z-20 bg-[#0b1222]/95 border border-slate-700/80 rounded-xl p-4 max-w-sm w-full shadow-2xl backdrop-blur space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-slate-200 font-mono">
                  {selectedFlight.flightNumber}
                </span>
              </div>
              <button
                onClick={() => setSelectedFlight(null)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block">AIRCRAFT</span>
                <span className="text-slate-200">{selectedFlight.aircraft}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">AIRTIME</span>
                <span className="text-slate-200">
                  {Math.round(selectedFlight.durationSec / 60)} mins
                </span>
              </div>
            </div>

            <Link
              href={`/flights/${selectedFlight.flightId}`}
              className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Inspect Flight Telemetry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
