import { Role } from "@/generated/prisma/enums";

/**
 * Checks if the user has AGENCY role.
 */
export function isAgency(role?: Role | string | null): boolean {
  return role === Role.AGENCY;
}

/**
 * Checks if the user has WARGA role.
 */
export function isCitizen(role?: Role | string | null): boolean {
  return role === Role.WARGA || role === "WARGA";
}

/**
 * Checks if the user has DEVELOPER role.
 */
export function isDeveloper(role?: Role | string | null): boolean {
  return role === Role.DEVELOPER;
}

export function canManage(role?: Role | string | null): boolean {
  return isAgency(role) || isDeveloper(role);
}

export const canManageProjects = isDeveloper;

export function canAccessSensitiveResidentData(
  role?: Role | string | null,
): boolean {
  return canManage(role);
}

/**
 * Utility to mask a phone number (e.g. 08123456789 -> 0812****789)
 */
export function maskPhone(phone?: string | null): string {
  if (!phone) return "";
  const trimmed = phone.trim();
  if (trimmed.length <= 4) return "****";
  const start = trimmed.slice(0, 4);
  const end = trimmed.length > 7 ? trimmed.slice(-3) : "";
  return `${start}****${end}`;
}

/**
 * Utility to mask a NIK or KK number (e.g. 3204123456780001 -> 3204************)
 */
export function maskIdentityNumber(idNumber?: string | null): string {
  if (!idNumber) return "";
  const trimmed = idNumber.trim();
  if (trimmed.length <= 4) return "****************";
  return `${trimmed.slice(0, 4)}${"*".repeat(Math.max(0, trimmed.length - 4))}`;
}

export type SensitiveCitizenProfile = {
  fullName?: string | null;
  phone?: string | null;
  kkNumber?: string | null;
  nik?: string | null;
  blockHouse?: string | null;
  houseNumber?: string | null;
  isVerified?: boolean | null;
  verifiedAt?: Date | string | null;
  verifiedBy?: string | null;
  [key: string]: unknown;
};

/**
 * Masks sensitive resident profile fields.
 */
export function maskResidentProfile<T extends SensitiveCitizenProfile>(
  profile: T | null | undefined,
): T | null {
  if (!profile) return null;

  return {
    ...profile,
    phone: maskPhone(profile.phone),
    kkNumber: maskIdentityNumber(profile.kkNumber),
    nik: maskIdentityNumber(profile.nik),
  };
}
