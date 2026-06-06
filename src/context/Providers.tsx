"use client";
import { ReactNode } from "react";
import { ThemeProvider } from "./ThemeContext";
import { UserProvider } from "./UserContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <UserProvider>{children}</UserProvider>
    </ThemeProvider>
  );
}
