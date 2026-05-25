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
        zoom: 17.5,
        minZoom: 16,
        zoomSnap: 0.1,
        maxZoom: 19,
        maxBounds: bounds,
        maxBoundsViscosity: 0.5,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Create initial marker
      const marker = L.marker([lat || -6.941, lng || 107.7755], {
        draggable: true,
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
