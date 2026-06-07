export type ProfileTab = "personal" | "activity";

export type ProfileRole = "resident" | "agency";

export type ProfileActivityType =
  | "voted"
  | "commented"
  | "donated"
  | "project_created"
  | "project_updated"
  | "news_created"
  | "news_updated"
  | "warga_verified";

export type ProfileActivityItem = {
  id: string | number;
  type: ProfileActivityType;
  project: string;
  targetTitle: string;
  time: string;
  createdAt: string;
  actionDesc: string;
};

export type CitizenProfile = {
  fullName?: string | null;
  phone?: string | null;
  blockHouse?: string | null;
  houseNumber?: string | null;
  nik?: string | null;
  kk?: string | null;
  kkNumber?: string | null;
};

export type AgencyProfile = {
  agencyName?: string | null;
  phone?: string | null;
  address?: string | null;
};

export type UserWithProfile = {
  id: string;
  role: string | null;
  email: string;
  passwordHash?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;
  name?: string | null;
  phone?: string | null;
  blokRumah?: string | null;
  noRumah?: string | null;
  citizenProfile?: CitizenProfile | null;
  agencyProfile?: AgencyProfile | null;
};

export type ProjectActivitySource = {
  id: string;
  title: string;
  agencyId?: string | null;
  createdAt?: string;
};

export type NewsActivitySource = {
  id: string;
  title: string;
  createdById: string;
  createdAt?: string;
};

export type NewsListResponse = {
  items?: NewsActivitySource[];
};
