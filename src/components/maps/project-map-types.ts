export type ProjectMapStatus =
  | "Planning"
  | "Funding"
  | "Construction"
  | "Under Construction"
  | "Completed";

export type ProjectMapMarker = {
  id: string;
  name: string;
  status: string;
  address: string;
  lat?: number;
  lng?: number;
};
