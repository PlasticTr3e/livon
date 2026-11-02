import { Role } from "@/generated/prisma/enums";

/**
 * Checks if the user has ADMIN role.
 */
export function isAdmin(role?: Role | string | null): boolean {
  return role === Role.ADMIN || role === "ADMIN";
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
  return role === Role.DEVELOPER || role === "DEVELOPER";
}

/**
 * Enforces that DEVELOPER and unauthorized roles CANNOT access sensitive housing/citizen data.
 * Sensitive data includes: NIK, KK Number, Phone Number, and full resident identity details.
 * ONLY ADMIN is granted access to raw sensitive data.
 */
export function canAccessSensitiveResidentData(
  role?: Role | string | null,
): boolean {
  return isAdmin(role);
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
 * Masks sensitive resident profile fields for DEVELOPER or non-admin roles.
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
