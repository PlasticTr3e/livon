"use client";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix untuk default marker icons di Leaflet
delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: string })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Project = {
  id: string;
  name: string;
  status: string;
  address: string;
  lat?: number;
  lng?: number;
};

type MapLeafletProps = {
  projects: Project[];
  selectedProject: Project | null;
  onProjectSelect: (project: Project) => void;
};

const getMarkerColor = (status: string) => {
  switch (status) {
    case "Planning":
      return "#3b82f6"; // blue
    case "Funding":
      return "#eab308"; // yellow
    case "Construction":
      return "#f97316"; // orange
    case "Completed":
      return "#22c55e"; // green
    default:
      return "#6b7280"; // gray
  }
};

export function MapLeaflet({
  projects,
  selectedProject,
  onProjectSelect,
}: MapLeafletProps) {
  useEffect(() => {
    // Initialize map
    const map = L.map("map", {
      center: [-6.2088, 106.8456], // Jakarta coordinates
      zoom: 13,
      zoomControl: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add markers for each project
    const markers: L.Marker[] = [];
    projects.forEach((project, idx) => {
      // Mock coordinates - in production, these should come from database
      const baseLatLng: [number, number] = [
        -6.2088 + idx * 0.01 - 0.02,
        106.8456 + idx * 0.015 - 0.015,
      ];
      const lat = project.lat || baseLatLng[0];
      const lng = project.lng || baseLatLng[1];

      // Create custom icon
      const markerColor = getMarkerColor(project.status);
      const customIcon = L.divIcon({
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
          " class="marker-pin">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif;">
            <strong style="font-size: 14px; color: #1f2937;">${project.name}</strong><br/>
            <span style="font-size: 12px; color: #6b7280;">${project.address}</span><br/>
            <span style="
              display: inline-block;
              margin-top: 4px;
              padding: 2px 8px;
              background-color: ${markerColor}20;
              color: ${markerColor};
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
            ">${project.status}</span>
          </div>
        `);

      marker.on("click", () => {
        onProjectSelect(project);

        // Highlight selected marker
        markers.forEach((m) => {
          const icon = m.getElement();
          if (icon) {
            const pin = icon.querySelector(".marker-pin") as HTMLElement;
            if (pin) {
              pin.style.transform = "scale(1)";
              pin.style.zIndex = "1000";
            }
          }
        });

        const selectedIcon = marker.getElement();
        if (selectedIcon) {
          const pin = selectedIcon.querySelector(".marker-pin") as HTMLElement;
          if (pin) {
            pin.style.transform = "scale(1.3)";
            pin.style.zIndex = "2000";
          }
        }
      });

      markers.push(marker);
    });

    // Cleanup on unmount
    return () => {
      map.remove();
    };
  }, [projects, onProjectSelect]);

  // Highlight selected project marker
  useEffect(() => {
    if (selectedProject) {
      const markerElements = document.querySelectorAll(".marker-pin");
      markerElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.transform = "scale(1)";
        htmlEl.style.zIndex = "1000";
      });

      // Find and highlight the selected marker
      // This is a simplified approach - in production, you'd want to track markers by ID
      const selectedIdx = projects.findIndex(
        (p) => p.id === selectedProject.id,
      );
      if (selectedIdx !== -1 && markerElements[selectedIdx]) {
        const selectedEl = markerElements[selectedIdx] as HTMLElement;
        selectedEl.style.transform = "scale(1.3)";
        selectedEl.style.zIndex = "2000";
      }
    }
  }, [selectedProject, projects]);

  return <div id="map" className="w-full h-full" style={{ zIndex: 0 }} />;
}
