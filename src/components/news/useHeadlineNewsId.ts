"use client";

import { useSyncExternalStore } from "react";

export function useHeadlineNewsId() {
  return useSyncExternalStore(
    () => () => undefined,
    () => localStorage.getItem("headline-news-id"),
    () => null,
  );
}
