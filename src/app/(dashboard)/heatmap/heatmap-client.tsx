"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Map, MapPin, Layers, Flame, Info, Check, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Point {
  id: string;
  type: string; // emergency, society, marketplace
  title: string;
  lat: number;
  lng: number;
}

interface HeatmapClientProps {
  center: {
    lat: number;
    lng: number;
    area: string;
    pincode: string;
  };
  points: Point[];
  mapboxToken: string;
}

export function HeatmapClient({ center, points, mapboxToken }: HeatmapClientProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [filterType, setFilterType] = useState<"ALL" | "EMERGENCY" | "SOCIETY" | "MARKETPLACE">("ALL");
  const [isPlaceholder, setIsPlaceholder] = useState(true);

  // Determine if Mapbox token is a placeholder
  useEffect(() => {
    if (mapboxToken && mapboxToken.startsWith("pk.ey") && mapboxToken.length > 50) {
      setIsPlaceholder(false);
    } else {
      setIsPlaceholder(true);
    }
  }, [mapboxToken]);

  // Mapbox GL initialization (runs only if not placeholder)
  useEffect(() => {
    if (isPlaceholder || !mapContainer.current) return;

    // We dynamically import mapbox-gl to prevent SSR issues
    import("mapbox-gl").then((mapboxglModule) => {
      const mapboxgl = mapboxglModule.default;
      mapboxgl.accessToken = mapboxToken;

      const map = new mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [center.lng, center.lat],
        zoom: 14,
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Add map markers based on filter
      const activePoints = points.filter((p) => {
        if (filterType === "ALL") return true;
        return p.type === filterType.toLowerCase();
      });

      activePoints.forEach((point) => {
        // Create custom HTML element for marker
        const el = document.createElement("div");
        el.className = "custom-marker";
        el.style.width = "24px";
        el.style.height = "24px";
        el.style.borderRadius = "50%";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
        el.style.cursor = "pointer";

        if (point.type === "emergency") {
          el.style.backgroundColor = "#ef4444";
          el.innerHTML = "🚨";
        } else if (point.type === "society") {
          el.style.backgroundColor = "#10b981";
          el.innerHTML = "🏢";
        } else {
          el.style.backgroundColor = "#3b82f6";
          el.innerHTML = "🛍️";
        }

        // Popup details
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div style="color: black; font-size: 11px; font-weight: bold; padding: 4px;">${point.title}</div>`
        );

        new mapboxgl.Marker(el)
          .setLngLat([point.lng, point.lat])
          .setPopup(popup)
          .addTo(map);
      });

      return () => map.remove();
    });
  }, [isPlaceholder, filterType, points, center, mapboxToken]);

  const filteredPoints = points.filter((p) => {
    if (filterType === "ALL") return true;
    return p.type === filterType.toLowerCase();
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header Info */}
      <div className="border-b border-slate-200 dark:border-zinc-800 pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Mohalla Proximity Map</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Explore local activities, gated societies, marketplace offers, and active emergency points in{" "}
          <strong>{center.area} ({center.pincode})</strong>.
        </p>
      </div>

      {/* Map Control Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Toggles Panel */}
        <div className="space-y-4">
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow p-6">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-emerald-500" />
              <span>Map Filters</span>
            </h3>

            <div className="space-y-2">
              {[
                { label: "Show All Zones", value: "ALL", color: "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950" },
                { label: "Emergencies (Red)", value: "EMERGENCY", color: "bg-red-500 text-white" },
                { label: "Societies (Green)", value: "SOCIETY", color: "bg-emerald-500 text-white" },
                { label: "Marketplace (Blue)", value: "MARKETPLACE", color: "bg-blue-500 text-white" },
              ].map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setFilterType(btn.value as any)}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                    filterType === btn.value
                      ? btn.color + " shadow"
                      : "bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-850"
                  }`}
                >
                  <span>{btn.label}</span>
                  {filterType === btn.value && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </Card>

          {/* POI Legend */}
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Locations Listing ({filteredPoints.length})
            </h3>
            <div className="space-y-2.5 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-850">
              {filteredPoints.length === 0 ? (
                <p className="text-[10px] text-zinc-500 italic py-2">No points found in range.</p>
              ) : (
                filteredPoints.map((p) => (
                  <div key={p.id} className="text-xs pt-2.5 first:pt-0 flex items-start gap-2">
                    <MapPin className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                      p.type === "emergency" ? "text-red-500" : p.type === "society" ? "text-emerald-500" : "text-blue-500"
                    }`} />
                    <span className="font-semibold text-slate-700 dark:text-zinc-350">{p.title}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Map Panel (3 cols) */}
        <div className="lg:col-span-3">
          <div className="relative rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 h-[500px] overflow-hidden shadow-2xl flex flex-col items-center justify-center p-4">
            
            {isPlaceholder ? (
              // Stunning Fallback simulated Heatmap
              <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-center p-8 select-none overflow-hidden">
                {/* Simulated Grid Gridlines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:30px_30px]" />
                
                {/* Dynamic heat glows */}
                <div className="absolute top-1/3 left-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] animate-pulse" />
                <div className="absolute bottom-1/4 left-1/4 w-36 h-36 bg-red-500/10 rounded-full blur-[50px] animate-ping" />
                <div className="absolute top-1/4 right-1/4 w-44 h-44 bg-blue-500/10 rounded-full blur-[65px] animate-pulse" />

                <div className="z-10 max-w-md space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto text-emerald-500">
                    <Flame className="w-6 h-6 animate-bounce" />
                  </div>
                  <h3 className="text-lg font-extrabold tracking-tight text-white">
                    Interactive Activity Heatmap
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Mapbox API key is a placeholder. Displaying mock activity hubs of <strong>{center.area}</strong>.
                  </p>

                  {/* Interactive simulated pins */}
                  <div className="relative w-full h-48 border border-zinc-800 rounded-2xl bg-zinc-950/60 backdrop-blur overflow-hidden flex items-center justify-center">
                    <span className="absolute top-8 left-12 p-1 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white shadow-lg cursor-pointer">🚨 SOS Alert</span>
                    <span className="absolute top-24 right-16 p-1 bg-emerald-500 rounded-full flex items-center justify-center text-[8px] text-white shadow-lg cursor-pointer">🏢 Gaur City</span>
                    <span className="absolute bottom-8 left-24 p-1 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white shadow-lg cursor-pointer">🛍️ iPhone Sale</span>

                    <p className="text-[10px] text-zinc-650 font-bold uppercase tracking-widest animate-pulse">
                      Hover map nodes to discover
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Real Mapbox Canvas
              <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
            )}

            {/* Info Floating Tag */}
            <div className="absolute bottom-4 left-4 z-20 bg-white/90 dark:bg-zinc-900/90 backdrop-blur px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-zinc-800 text-[10px] font-bold flex items-center gap-1.5 shadow-lg">
              <Info className="w-4 h-4 text-emerald-500" />
              <span>Center coords: {center.lat.toFixed(4)}° N, {center.lng.toFixed(4)}° E</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
