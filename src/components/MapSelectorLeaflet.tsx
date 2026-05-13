"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: string })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapSelectorLeafletProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export default function MapSelectorLeaflet({
  lat,
  lng,
  onChange,
}: MapSelectorLeafletProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Define bounds for panning (aligned with perumahan area)
    const bounds = L.latLngBounds(
      [-6.944, 107.7725], // South-West bound
      [-6.9385, 107.7785], // North-East bound
    );

    // Initialize map
    if (!mapRef.current) {
      const map = L.map("map-selector", {
        center: [lat || -6.941, lng || 107.7755],
        zoom: 15.5,
        minZoom: 15.5,
        zoomSnap: 0.1,
        maxZoom: 19,
        maxBounds: bounds,
        maxBoundsViscosity: 0.5,
        zoomControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const customIcon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background-color: #3b82f6;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
          " class="marker-pin">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      // Create initial marker
      const marker = L.marker([lat || -6.941, lng || 107.7755], {
        draggable: true,
        icon: customIcon,
      }).addTo(map);

      marker.on("dragend", () => {
        const position = marker.getLatLng();
        onChange(position.lat, position.lng);
      });

      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        onChange(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
    } else {
      // Update marker if lat/lng changes from outside
      markerRef.current?.setLatLng([lat, lng]);
      mapRef.current.setView([lat, lng], mapRef.current.getZoom());
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [lat, lng, onChange]);

  return (
    <div
      id="map-selector"
      className="w-full h-full rounded-[2rem] overflow-hidden"
      style={{ zIndex: 0 }}
    />
  );
}
