"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import { getProjectMarkerColor } from "./project-map-utils";

type ProjectMiniMapProps = {
  lat?: number;
  lng?: number;
  status?: string;
};

function createMiniMarkerIcon(markerColor: string) {
  return L.divIcon({
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
}

export default function ProjectMiniMap({
  lat,
  lng,
  status,
}: ProjectMiniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || lat == null || lng == null) return;

    const markerColor = getProjectMarkerColor(status);

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
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
        map,
      );

      const marker = L.marker([lat, lng], {
        icon: createMiniMarkerIcon(markerColor),
      }).addTo(map);

      mapRef.current = map;
      markerRef.current = marker;
      return;
    }

    markerRef.current?.setLatLng([lat, lng]);
    markerRef.current?.setIcon(createMiniMarkerIcon(markerColor));
    mapRef.current.setView([lat, lng], 16);
  }, [lat, lng, status]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  if (lat == null || lng == null) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 text-slate-400">
        <MapPin className="h-8 w-8 opacity-20" />
        <span className="text-[10px] font-bold uppercase tracking-widest">
          Location Unavailable
        </span>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="h-full w-full overflow-hidden rounded-2xl brightness-[0.95] contrast-[1.1] grayscale-[0.5]"
    />
  );
}
