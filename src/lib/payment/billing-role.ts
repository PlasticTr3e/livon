"use client";

import { useUser } from "@/context/UserContext";
import { getStoredPaymentToken } from "./payment-api";

/** Roles exactly as stored in the database (`enum Role`). */
export type BillingRole = "ADMIN" | "WARGA" | "DEVELOPER";

const BILLING_ROLES: BillingRole[] = ["ADMIN", "WARGA", "DEVELOPER"];

/** Reads `role` from the login JWT payload. The API still enforces access. */
function readTokenRole(): BillingRole | null {
  try {
    const payload = getStoredPaymentToken()?.split(".")[1];
    if (!payload) return null;

    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const role = (JSON.parse(json) as { role?: unknown }).role;
    return BILLING_ROLES.find((item) => item === role) ?? null;
  } catch {
    return null;
  }
}

/** The signed-in user's database role, or null while loading / signed out. */
export function useBillingRole() {
  const { isAuthenticated, isUserLoading } = useUser();
  const role = isAuthenticated ? readTokenRole() : null;

  return {
    role,
    isAuthenticated,
    isLoading: isUserLoading,
    isWarga: role === "WARGA",
    isAdmin: role === "ADMIN",
  };
}
