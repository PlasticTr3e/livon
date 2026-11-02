export type CctvCamera = {
  id: string;
  name: string;
  location: string;
  rt: string;
  rw: string;
  status: "demo" | "offline";
  poster: string;
  source?: string;
};

// Frontend preview only. Replace these sample locations and sources when real feeds are available.
export const cctvCameras: CctvCamera[] = [
  {
    id: "cam-01",
    name: "Main entrance",
    location: "Entrance area",
    rt: "001",
    rw: "001",
    status: "demo",
    poster: "/cctv/traffic-preview.jpg",
    source: "/cctv/traffic-demo.mp4",
  },
  {
    id: "cam-02",
    name: "Access road",
    location: "Neighborhood road",
    rt: "002",
    rw: "001",
    status: "demo",
    poster: "/cctv/traffic-preview.jpg",
    source: "/cctv/traffic-demo.mp4",
  },
  {
    id: "cam-03",
    name: "Community area",
    location: "Shared spaces",
    rt: "001",
    rw: "002",
    status: "demo",
    poster: "/cctv/traffic-preview.jpg",
    source: "/cctv/traffic-demo.mp4",
  },
  {
    id: "cam-04",
    name: "Parking area",
    location: "Resident parking",
    rt: "002",
    rw: "002",
    status: "offline",
    poster: "/cctv/traffic-preview.jpg",
  },
];
