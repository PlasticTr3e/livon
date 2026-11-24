export type ProfileRole = "resident" | "agency";

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
