"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { configureLeafletDefaultIcons } from "./leaflet-default-icons";
import {
  DEFAULT_PROJECT_COORDINATES,
  getFallbackProjectCoordinates,
  getProjectMarkerColor,
  HOUSING_AREA_BOUNDS,
} from "./project-map-utils";
import type { ProjectMapMarker } from "./project-map-types";

type ProjectMapProps = {
  projects: ProjectMapMarker[];
  selectedProject: ProjectMapMarker | null;
  onProjectSelect: (project: ProjectMapMarker) => void;
};

const PROJECT_POPUP_HOVER_DELAY_MS = 650;

function createProjectMarkerIcon(markerColor: string) {
  return L.divIcon({
    className: "custom-marker",
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
        cursor: pointer;
        transition: all 0.3s ease;
      " class="project-marker-pin">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
}

function escapePopupText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createProjectPopup(project: ProjectMapMarker, markerColor: string) {
  const projectName = escapePopupText(project.name);
  const projectAddress = escapePopupText(project.address);
  const projectStatus = escapePopupText(project.status);

  return `
    <div style="font-family: sans-serif;">
      <strong style="font-size: 14px; color: #1f2937;">${projectName}</strong><br/>
      <span style="font-size: 12px; color: #6b7280;">${projectAddress}</span><br/>
      <span style="
        display: inline-block;
        margin-top: 4px;
        padding: 2px 8px;
        background-color: ${markerColor}20;
        color: ${markerColor};
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      ">${projectStatus}</span>
    </div>
  `;
}

function setMarkerScale(marker: L.Marker, scale: number, zIndex: number) {
  const markerElement = marker.getElement();
  const pin = markerElement?.querySelector(
    ".project-marker-pin",
  ) as HTMLElement | null;

  if (!pin) return;

  pin.style.transform = `scale(${scale})`;
  pin.style.zIndex = String(zIndex);
}

export default function ProjectMap({
  projects,
  selectedProject,
  onProjectSelect,
}: ProjectMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const onProjectSelectRef = useRef(onProjectSelect);
  const markersByProjectIdRef = useRef(new Map<string, L.Marker>());

  useEffect(() => {
    onProjectSelectRef.current = onProjectSelect;
  }, [onProjectSelect]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    configureLeafletDefaultIcons();

    const bounds = L.latLngBounds(...HOUSING_AREA_BOUNDS);
    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_PROJECT_COORDINATES,
      zoom: 17.5,
      minZoom: 17.5,
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

    const markersByProjectId = new Map<string, L.Marker>();
    markersByProjectIdRef.current = markersByProjectId;

    projects.forEach((project, index) => {
      const fallbackCoordinates = getFallbackProjectCoordinates(index);
      const lat = project.lat ?? fallbackCoordinates[0];
      const lng = project.lng ?? fallbackCoordinates[1];
      const markerColor = getProjectMarkerColor(project.status);
      let popupOpenTimeout: ReturnType<typeof window.setTimeout> | null = null;
      const marker = L.marker([lat, lng], {
        icon: createProjectMarkerIcon(markerColor),
      })
        .addTo(map)
        .bindPopup(createProjectPopup(project, markerColor), {
          autoPan: false,
        });

      marker.off("click");

      marker.on("mouseover", () => {
        popupOpenTimeout = window.setTimeout(() => {
          marker.openPopup();
        }, PROJECT_POPUP_HOVER_DELAY_MS);
      });

      marker.on("mouseout", () => {
        if (popupOpenTimeout) {
          window.clearTimeout(popupOpenTimeout);
          popupOpenTimeout = null;
        }
        marker.closePopup();
      });

      marker.on("click", () => {
        if (popupOpenTimeout) {
          window.clearTimeout(popupOpenTimeout);
          popupOpenTimeout = null;
        }
        marker.closePopup();
        markersByProjectId.forEach((item) => setMarkerScale(item, 1, 1000));
        setMarkerScale(marker, 1.3, 2000);
        onProjectSelectRef.current(project);
      });

      markersByProjectId.set(project.id, marker);
    });

    return () => {
      markersByProjectId.clear();
      map.remove();
    };
  }, [projects]);

  useEffect(() => {
    markersByProjectIdRef.current.forEach((marker, projectId) => {
      const isSelected = selectedProject?.id === projectId;
      setMarkerScale(marker, isSelected ? 1.3 : 1, isSelected ? 2000 : 1000);
    });
  }, [selectedProject]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
}
