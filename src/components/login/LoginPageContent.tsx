"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { apiFetchJson } from "@/lib/api-client";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/components/shared/AppToaster";
import {
  getLoginRedirectPath,
  mapApiRoleToLoginRole,
} from "@/lib/login/login-auth";
import { fetchSessionDisplayName } from "@/lib/app-shell/session-profile";
import {
  LOGIN_HERO_IMAGES,
  LOGIN_SUCCESS_MESSAGES,
} from "@/lib/login/login-copy";
import { LoginFormPanel, type LoginCredentials } from "./LoginFormPanel";
import { LoginHeroPanel } from "./LoginHeroPanel";

type LoginResponse = {
  token: string;
  user: {
    email: string;
    name?: string | null;
    role?: string | null;
  };
};

export function LoginPageContent() {
  const router = useRouter();
  const { login } = useUser();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [registered, setRegistered] = useQueryState(
    "registered",
    parseAsString,
  );
  const [verified, setVerified] = useQueryState("verified", parseAsString);

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [activeHeroImageIndex, setActiveHeroImageIndex] = useState(0);

  useEffect(() => {
    if (registered === "true") {
      toast.success("Success", LOGIN_SUCCESS_MESSAGES.registered);
      setRegistered(null);
      return;
    }

    if (verified === "true") {
      toast.success("Success", LOGIN_SUCCESS_MESSAGES.verified);
      setVerified(null);
    }
  }, [registered, setRegistered, setVerified, toast, verified]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveHeroImageIndex(
        (currentIndex) => (currentIndex + 1) % LOGIN_HERO_IMAGES.length,
      );
    }, 3000);

    return () => window.clearInterval(interval);
  }, []);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setCredentials((currentCredentials) => ({
      ...currentCredentials,
      [name]: value,
    }));
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    if (isLoading) return;

    setIsLoading(true);

    try {
      const result = await apiFetchJson<LoginCredentials, LoginResponse>(
        "/api/auth/login",
        "POST",
        credentials,
      );

      if (!result.success || !result.data) {
        const errorMessage = result.message || "Login failed";
        toast.error("Login failed", errorMessage);
        return;
      }

      const mappedRole = mapApiRoleToLoginRole(result.data.user.role);

      localStorage.setItem("livon-token", result.data.token);
      const userName = await fetchSessionDisplayName(result.data.token);
      login(mappedRole, userName);
      router.push(getLoginRedirectPath(mappedRole));
    } catch {
      const errorMessage = "Unable to sign in right now. Please try again.";
      toast.error("Login failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0B1120]">
      <LoginFormPanel
        credentials={credentials}
        isLoading={isLoading}
        isPasswordVisible={isPasswordVisible}
        theme={theme}
        onChange={handleInputChange}
        onSubmit={handleLogin}
        onTogglePasswordVisibility={() =>
          setIsPasswordVisible((isVisible) => !isVisible)
        }
        onToggleTheme={toggleTheme}
      />
      <LoginHeroPanel activeImageIndex={activeHeroImageIndex} />
    </div>
  );
}
