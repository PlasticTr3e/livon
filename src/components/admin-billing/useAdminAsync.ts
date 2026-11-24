"use client";

import { useCallback, useEffect, useState } from "react";

/** Loads data for an admin panel; re-runs when deps change, abortable, with reload(). */
export function useAdminAsync<T>(
  load: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    load(controller.signal)
      .then((result) => setData(result))
      .catch((cause: Error) => {
        if (!controller.signal.aborted)
          setError(cause.message || "Data belum dapat dimuat.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);
  const reload = useCallback(() => setNonce((value) => value + 1), []);
  return { data, error, loading, reload };
}
