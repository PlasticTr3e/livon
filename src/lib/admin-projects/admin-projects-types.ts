export type AdminProjectStatus =
  | "USULAN"
  | "DISETUJUI"
  | "BERJALAN"
  | "SELESAI";

export type AdminProjectSummary = {
  id: string;
  name: string;
  status: AdminProjectStatus;
  budget: string;
  votes: number;
  date: string;
  category: string;
};

export type AdminProjectStatusConfig = {
  label: string;
  style: string;
  dot: string;
  iconBg: string;
  iconColor: string;
  border: string;
};

export type AdminProjectCategory = {
  id: number;
  name: string;
};

export type ExistingAdminProjectLocation = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
};
