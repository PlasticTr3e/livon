"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";

interface ProjectMiniMapProps {
  lat?: number;
  lng?: number;
  status?: string;
}

export default function ProjectMiniMap({
  lat,
  lng,
  status,
}: ProjectMiniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || !lat || !lng) return;

    // Initialize map if not already initialized
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 17,
        zoomControl: false,
        dragging: true,
        scrollWheelZoom: false,
        doubleClickZoom: true,
        touchZoom: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
        mapRef.current,
      );

      const markerColor =
        status === "Completed"
          ? "#22c55e"
          : status === "Construction"
            ? "#f97316"
            : status === "Funding"
              ? "#eab308"
              : "#3b82f6";

      const customIcon = L.divIcon({
        className: "custom-mini-marker",
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background-color: ${markerColor};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      L.marker([lat, lng], { icon: customIcon }).addTo(mapRef.current);
    } else {
      // Update center if lat/lng changes
      mapRef.current.setView([lat, lng], 16);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, status]);

  if (!lat || !lng) {
    return (
      <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-2 border border-slate-100 rounded-2xl">
        <MapPin className="w-8 h-8 opacity-20" />
        <span className="text-[10px] font-bold uppercase tracking-widest">
          Location Unavailable
        </span>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full rounded-2xl overflow-hidden grayscale-[0.5] contrast-[1.1] brightness-[0.95]"
    />
  );
}
