"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@/context/UserContext";
import type { getFinanceHub } from "@/services/finance/finance-hub";
export type FinanceHubData = Awaited<ReturnType<typeof getFinanceHub>>;
export type FinanceQuery = {
  billPage: number;
  expensePage: number;
  orderPage: number;
  incomePage: number;
  managementPage: number;
  expenseFund: "ALL" | "IPL" | "DONASI";
  orderFund: "ALL" | "IPL" | "DONASI";
};

export async function financeRequest<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  const token = localStorage.getItem("livon-token");
  if (!token) throw new Error("Silakan masuk untuk melihat tagihan Anda.");
  const response = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok || !result.success)
    throw new Error(result.message || "Permintaan belum berhasil. Coba lagi.");
  return result.data as T;
}

export function useFinanceHub(
  billId?: string,
  initialQuery: Partial<FinanceQuery> = {},
) {
  const [query, setQuery] = useState<FinanceQuery>(() => ({
    billPage: 1,
    expensePage: 1,
    orderPage: 1,
    incomePage: 1,
    managementPage: 1,
    expenseFund: "ALL",
    orderFund: "ALL",
    ...initialQuery,
  }));
  const { isAuthenticated, isUserLoading, userName, userRole } = useUser();
  const [data, setData] = useState<FinanceHubData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const sequence = useRef(0);
  const invalidateRequests = useCallback(() => {
    sequence.current += 1;
  }, []);
  const refresh = useCallback(async () => {
    const current = ++sequence.current;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams(
        Object.entries(query).map(([key, value]) => [key, String(value)]),
      );
      if (billId) params.set("billId", billId);
      const next = await financeRequest<FinanceHubData>(
        "/api/finance/hub?" + params,
      );
      if (sequence.current === current) setData(next);
    } catch (cause) {
      if (sequence.current === current) {
        setData(null);
        setError(
          cause instanceof Error ? cause.message : "Data belum dapat dimuat.",
        );
      }
    } finally {
      if (sequence.current === current) setLoading(false);
    }
  }, [query, billId]);
  useEffect(() => {
    if (isUserLoading) return;
    const timer = window.setTimeout(() => void refresh(), 0);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(timer);
      invalidateRequests();
      window.removeEventListener("focus", onFocus);
    };
  }, [
    refresh,
    isAuthenticated,
    isUserLoading,
    userName,
    userRole,
    invalidateRequests,
  ]);
  return { data, error, loading, refresh, query, setQuery };
}
