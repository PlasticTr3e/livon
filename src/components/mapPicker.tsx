"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Mengabaikan peringatan tipe pada baris ini karena ini adalah cara standar memperbaiki ikon Leaflet di Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// 1. Mendefinisikan tipe data yang spesifik untuk menggantikan 'any'
interface Position {
  lat: number;
  lng: number;
}

interface LocationMarkerProps {
  position: Position;
  setPosition: (pos: Position) => void;
  readOnly?: boolean;
}

// Menangkap klik dari user
function LocationMarker({
  position,
  setPosition,
  readOnly,
}: LocationMarkerProps) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], map.getZoom(), {
        animate: false,
      });
    }
  }, [position, map]);

  // 2. Mengeluarkan Hook dari blok 'if', lalu memindahkan kondisi 'if' ke dalam fungsinya
  useMapEvents({
    click(e) {
      // Hanya izinkan perubahan posisi jika TIDAK dalam mode readOnly
      if (!readOnly) {
        setPosition({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        });
      }
    },
  });

  return <Marker position={[position.lat, position.lng]} />;
}

interface MapPickerProps {
  position: Position;
  setPosition: (pos: Position) => void;
  readOnly?: boolean;
}

export default function MapPicker({
  position,
  setPosition,
  readOnly = false,
}: MapPickerProps) {
  return (
    <MapContainer
      center={[position.lat, position.lng]}
      zoom={15.5}
      minZoom={15.5}
      maxZoom={19}
      zoomSnap={0.1}
      maxBounds={[
        [-6.944, 107.7725],
        [-6.9385, 107.7785],
      ]}
      maxBoundsViscosity={0.5}
      zoomControl={false}
      scrollWheelZoom={!readOnly}
      dragging={!readOnly}
      doubleClickZoom={!readOnly}
      className="h-full w-full z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <LocationMarker
        position={position}
        setPosition={setPosition}
        readOnly={readOnly}
      />
    </MapContainer>
  );
}
