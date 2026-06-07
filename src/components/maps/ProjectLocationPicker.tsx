"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { configureLeafletDefaultIcons } from "./leaflet-default-icons";
import {
  DEFAULT_PROJECT_COORDINATES,
  HOUSING_AREA_BOUNDS,
} from "./project-map-utils";

type ProjectLocationPickerProps = {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
};

export default function ProjectLocationPicker({
  lat,
  lng,
  onChange,
}: ProjectLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const initialCoordinatesRef = useRef<[number, number]>([
    lat || DEFAULT_PROJECT_COORDINATES[0],
    lng || DEFAULT_PROJECT_COORDINATES[1],
  ]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    configureLeafletDefaultIcons();

    const bounds = L.latLngBounds(...HOUSING_AREA_BOUNDS);
    const initialCoordinates = initialCoordinatesRef.current;

    const map = L.map(mapContainerRef.current, {
      center: initialCoordinates,
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

    const marker = L.marker(initialCoordinates, { draggable: true }).addTo(map);

    marker.on("dragend", () => {
      const position = marker.getLatLng();
      onChangeRef.current(position.lat, position.lng);
    });

    map.on("click", (event) => {
      marker.setLatLng(event.latlng);
      onChangeRef.current(event.latlng.lat, event.latlng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], mapRef.current.getZoom());
  }, [lat, lng]);

  return (
    <div
      ref={mapContainerRef}
      className="h-full w-full overflow-hidden rounded-[2rem]"
      style={{ zIndex: 0 }}
    />
  );
}
