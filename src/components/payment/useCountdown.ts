"use client";

import { useEffect, useState } from "react";

/** Counts down once per second while `isRunning` is true. */
export function useCountdown(initialSeconds: number, isRunning: boolean) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (!isRunning) return;

    const timer = window.setInterval(
      () => setSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [isRunning]);

  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remaining = (seconds % 60).toString().padStart(2, "0");

  return {
    seconds,
    label: `${minutes}:${remaining}`,
    isExpired: seconds === 0,
  };
}
