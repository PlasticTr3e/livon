"use client";
import { useLanguage } from "@/context/LanguageContext";

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import {
  fetchProfileUser,
  getStoredProfileToken,
  updateProfileUser,
} from "@/lib/profile/profile-api";
import {
  getProfileRole,
  getProfileDisplayName,
  getProfileRoleLabel,
  mergeUpdatedProfile,
} from "@/lib/profile/profile-user";
import type { UserWithProfile } from "@/lib/profile/profile-types";
import { useToast } from "@/components/shared/AppToaster";
import { LoadingState } from "@/components/shared/LoadingState";
import { getUserAvatarClassName, getUserInitial } from "@/lib/app-shell/user";
import { cn } from "@/components/ui/primitives";
import { ProfilePersonalInformationPanel } from "./ProfilePersonalInformationPanel";

export function ProfilePageContent() {
  const { t: translateUi } = useLanguage();

  const toast = useToast();
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    const request = new AbortController();
    async function loadProfile() {
      try {
        const token = getStoredProfileToken();
        if (token) setUser(await fetchProfileUser(token, request.signal));
      } catch {
        if (!request.signal.aborted) setUser(null);
      } finally {
        if (!request.signal.aborted) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => request.abort();
  }, []);

  async function handleProfileUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = getStoredProfileToken();
    if (!token || !user) return;

    const formData = new FormData(event.currentTarget);
    const phoneError = validatePhoneNumber(formData);
    if (phoneError) {
      toast.error("Validation failed", phoneError);
      return;
    }

    const passwordError = validatePasswordUpdate(formData);
    if (passwordError) {
      toast.error("Password update failed", passwordError);
      return;
    }

    setIsSavingProfile(true);

    try {
      const updatedProfile = await updateProfileUser(user, formData, token);

      if (!updatedProfile) {
        toast.error("Failed to save personal information");
        return;
      }

      setUser((currentUser) =>
        currentUser ? mergeUpdatedProfile(currentUser, updatedProfile) : null,
      );
      toast.success("Saved", "Personal information saved.");
    } catch (error) {
      toast.error(
        "Failed to save personal information",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  if (isLoading) return <LoadingState label="Memuat akun…" />;

  if (!user) {
    return (
      <div className="p-10 text-red-500">
        {translateUi("User not found or not logged in.")}
      </div>
    );
  }

  const userRole = getProfileRole(user);
  const isDeveloper = user.role === "DEVELOPER";
  const displayName = getProfileDisplayName(user, userRole);
  const avatarRole = isDeveloper ? "developer" : userRole;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0B1120]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <header className="mb-6 flex items-start gap-3 border-b border-slate-200 pb-5 dark:border-slate-800">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-green-600 text-white shadow-sm">
            <UserRound aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
              {translateUi("My account")}
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {translateUi("Manage your account details and preferences.")}
            </p>
          </div>
        </header>

        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className={cn(
                "grid size-12 shrink-0 place-items-center rounded-full text-lg font-semibold text-white",
                getUserAvatarClassName(avatarRole),
              )}
            >
              {getUserInitial(displayName)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="break-words font-semibold text-slate-950 dark:text-white">
                  {displayName}
                </p>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-medium",
                    isDeveloper
                      ? "bg-purple-50 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
                  )}
                >
                  {translateUi(
                    isDeveloper ? "Developer" : getProfileRoleLabel(userRole),
                  )}
                </span>
              </div>
              <p className="mt-1 break-all text-sm text-slate-600 dark:text-slate-300">
                {user.email}
              </p>
            </div>
          </div>
        </section>

        <ProfilePersonalInformationPanel
          isSaving={isSavingProfile}
          user={user}
          userRole={userRole}
          onSubmit={handleProfileUpdate}
        />
      </div>
    </div>
  );
}

function validatePhoneNumber(formData: FormData) {
  const phone = String(formData.get("phone") || "").trim();

  if (!phone) return "Phone number is required.";
  if (!/^\d{10,13}$/.test(phone)) {
    return "Phone number must contain 10 to 13 digits.";
  }

  return null;
}

function validatePasswordUpdate(formData: FormData) {
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  const hasPasswordInput = Boolean(
    currentPassword || newPassword || confirmPassword,
  );

  if (!hasPasswordInput) return null;
  if (!currentPassword || !newPassword || !confirmPassword) {
    return "Current password, new password, and confirmation are required.";
  }
  if (newPassword !== confirmPassword) {
    return "Passwords do not match.";
  }

  return null;
}
