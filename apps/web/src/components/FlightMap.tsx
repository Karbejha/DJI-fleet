"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { TelemetrySample, GeoPoint } from "@dji-fleet/shared";
import { Layers, Eye, Navigation, ShieldAlert } from "lucide-react";

interface FlightMapProps {
  telemetry: TelemetrySample[];
  takeoffLocation?: GeoPoint;
  landingLocation?: GeoPoint;
  homeLocation?: GeoPoint;
  currentSampleIndex?: number;
  colorMode?: "altitude" | "speed" | "battery" | "signal" | "flightMode";
  onSampleSelect?: (index: number) => void;
  warnings?: Array<{ lat: number; lon: number; title: string }>;
}

export const FlightMap: React.FC<FlightMapProps> = ({
  telemetry,
  takeoffLocation,
  landingLocation,
  homeLocation,
  currentSampleIndex = 0,
  colorMode = "altitude",
  onSampleSelect,
  warnings = [],
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const droneMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [mapStyle, setMapStyle] = useState<"dark" | "satellite" | "streets">("dark");

  const getStyleUrl = (style: "dark" | "satellite" | "streets") => {
    switch (style) {
      case "satellite":
        return {
          version: 8 as const,
          sources: {
            "satellite-tiles": {
              type: "raster" as const,
              tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
              ],
              tileSize: 256,
            },
          },
          layers: [
            {
              id: "satellite-layer",
              type: "raster" as const,
              source: "satellite-tiles",
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        };
      case "streets":
        return {
          version: 8 as const,
          sources: {
            "osm-tiles": {
              type: "raster" as const,
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
            },
          },
          layers: [
            {
              id: "osm-layer",
              type: "raster" as const,
              source: "osm-tiles",
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        };
      case "dark":
      default:
        return {
          version: 8 as const,
          sources: {
            "dark-tiles": {
              type: "raster" as const,
              tiles: [
                "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
                "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
            },
          },
          layers: [
            {
              id: "dark-layer",
              type: "raster" as const,
              source: "dark-tiles",
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        };
    }
  };

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current) return;

    // Filter valid GPS samples
    const validCoords = telemetry
      .filter((s) => s.latitude != null && s.longitude != null)
      .map((s) => [s.longitude!, s.latitude!] as [number, number]);

    const initialCenter: [number, number] =
      validCoords.length > 0
        ? validCoords[0]
        : takeoffLocation
        ? [takeoffLocation.longitude, takeoffLocation.latitude]
        : [36.7368, 36.0041];

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: getStyleUrl(mapStyle) as any,
      center: initialCenter,
      zoom: 15,
      pitch: 45,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      // 1. Add Flight Trajectory Source
      if (validCoords.length > 1) {
        map.addSource("flight-track", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: validCoords,
            },
            properties: {},
          },
        });

        // Track Line Glow
        map.addLayer({
          id: "flight-track-glow",
          type: "line",
          source: "flight-track",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#38bdf8",
            "line-width": 8,
            "line-opacity": 0.3,
          },
        });

        // Track Line Main
        map.addLayer({
          id: "flight-track-main",
          type: "line",
          source: "flight-track",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#0284c7",
            "line-width": 4,
          },
        });

        // Fit map bounds to track
        const bounds = validCoords.reduce(
          (b, coord) => b.extend(coord),
          new maplibregl.LngLatBounds(validCoords[0], validCoords[0])
        );
        map.fitBounds(bounds, { padding: 60 });
      }

      // 2. Add Takeoff Marker
      const toLat = takeoffLocation?.latitude || validCoords[0]?.[1];
      const toLon = takeoffLocation?.longitude || validCoords[0]?.[0];
      if (toLat && toLon) {
        const el = document.createElement("div");
        el.className = "takeoff-marker";
        el.innerHTML = `
          <div style="background:#10b981; border:2px solid #fff; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px #10b981;">
            <span style="color:#fff; font-size:10px; font-weight:bold;">T</span>
          </div>`;
        new maplibregl.Marker({ element: el })
          .setLngLat([toLon, toLat])
          .setPopup(new maplibregl.Popup().setText("Takeoff Location"))
          .addTo(map);
      }

      // 3. Add Landing Marker
      const landLat = landingLocation?.latitude || validCoords[validCoords.length - 1]?.[1];
      const landLon = landingLocation?.longitude || validCoords[validCoords.length - 1]?.[0];
      if (landLat && landLon && (landLat !== toLat || landLon !== toLon)) {
        const el = document.createElement("div");
        el.className = "landing-marker";
        el.innerHTML = `
          <div style="background:#ef4444; border:2px solid #fff; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px #ef4444;">
            <span style="color:#fff; font-size:10px; font-weight:bold;">L</span>
          </div>`;
        new maplibregl.Marker({ element: el })
          .setLngLat([landLon, landLat])
          .setPopup(new maplibregl.Popup().setText("Landing Location"))
          .addTo(map);
      }

      // 4. Add Replay Aircraft Marker
      const droneEl = document.createElement("div");
      droneEl.className = "drone-replay-marker";
      droneEl.innerHTML = `
        <div style="width:36px; height:36px; display:flex; align-items:center; justify-content:center; filter:drop-shadow(0 0 8px #38bdf8);">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="#38bdf8">
            <path d="M12 2L4 20L12 16L20 20L12 2Z" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
        </div>`;
      const marker = new maplibregl.Marker({ element: droneEl })
        .setLngLat(initialCenter)
        .addTo(map);
      droneMarkerRef.current = marker;
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [telemetry]);

  // Update Map Style
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyle(getStyleUrl(mapStyle) as any);
    }
  }, [mapStyle]);

  // Synchronize Aircraft Position during Playback
  useEffect(() => {
    if (!droneMarkerRef.current || !telemetry || telemetry.length === 0) return;
    const sample = telemetry[currentSampleIndex];
    if (sample && sample.latitude != null && sample.longitude != null) {
      droneMarkerRef.current.setLngLat([sample.longitude, sample.latitude]);
      const heading = sample.heading ?? sample.yaw ?? 0;
      droneMarkerRef.current.setRotation(Number(heading));
    }
  }, [currentSampleIndex, telemetry]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-xl overflow-hidden border border-slate-800 bg-[#090e1a]">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Layer / Style Controls Overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur p-1 rounded-lg border border-slate-700/80 text-xs">
        <button
          onClick={() => setMapStyle("dark")}
          className={`px-2.5 py-1 rounded font-medium transition-colors ${
            mapStyle === "dark" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Aviation Dark
        </button>
        <button
          onClick={() => setMapStyle("satellite")}
          className={`px-2.5 py-1 rounded font-medium transition-colors ${
            mapStyle === "satellite" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Satellite
        </button>
        <button
          onClick={() => setMapStyle("streets")}
          className={`px-2.5 py-1 rounded font-medium transition-colors ${
            mapStyle === "streets" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Street
        </button>
      </div>

      {/* Compass / Orientation indicator badge */}
      <div className="absolute bottom-4 right-4 z-10 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-2">
        <Navigation className="w-3.5 h-3.5 text-sky-400 transform -rotate-45" />
        <span>EPSG:4326 | WGS84</span>
      </div>
    </div>
  );
};
