"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  fetchProfileActivities,
  fetchProfileUser,
  getStoredProfileToken,
  updateProfileUser,
} from "@/lib/profile/profile-api";
import {
  getProfileRole,
  mergeUpdatedProfile,
} from "@/lib/profile/profile-user";
import type {
  ProfileActivityItem,
  ProfileTab,
  UserWithProfile,
} from "@/lib/profile/profile-types";
import { cn } from "@/components/ui/primitives";
import { ProfileActivityPanel } from "./ProfileActivityPanel";
import { ProfilePersonalInformationPanel } from "./ProfilePersonalInformationPanel";
import { ProfileSidebar } from "./ProfileSidebar";

export function ProfilePageContent() {
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activities, setActivities] = useState<ProfileActivityItem[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setSidebarOpen((prev) => !prev);
    window.addEventListener("toggle-app-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-app-sidebar", handleToggle);
  }, []);

  useEffect(() => {
    async function loadProfile() {
      const token = getStoredProfileToken();
      if (!token) {
        setUser(null);
        return;
      }

      const nextUser = await fetchProfileUser(token);
      setUser(nextUser);

      if (!nextUser) return;

      const nextActivities = await fetchProfileActivities(nextUser, token);
      setActivities(nextActivities);
    }

    loadProfile();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem("livon-token");
    window.location.href = "/auth/login";
  }

  async function handleProfileUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const token = getStoredProfileToken();
    if (!token || !user) return;

    const updatedProfile = await updateProfileUser(
      user,
      new FormData(event.currentTarget),
      token,
    );

    if (!updatedProfile) {
      setFeedback("Failed to update data.");
      return;
    }

    setUser((currentUser) =>
      currentUser ? mergeUpdatedProfile(currentUser, updatedProfile) : null,
    );
    setFeedback("Data successfully updated!");
  }

  if (!user) {
    return (
      <div className="p-10 text-red-500">User not found or not logged in.</div>
    );
  }

  const userRole = getProfileRole(user);

  return (
    <div className="relative flex h-full overflow-hidden bg-slate-50 dark:bg-[#0B1120]">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close profile navigation"
          className="absolute inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <ProfileSidebar
        activeTab={activeTab}
        user={user}
        userRole={userRole}
        isOpen={sidebarOpen}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSidebarOpen(false);
        }}
        onLogout={handleLogout}
      />

      <main className={cn("flex-1 overflow-y-auto p-6 pt-16 md:p-10")}>
        {activeTab === "personal" && (
          <ProfilePersonalInformationPanel
            feedback={feedback}
            user={user}
            userRole={userRole}
            onSubmit={handleProfileUpdate}
          />
        )}

        {activeTab === "activity" && (
          <ProfileActivityPanel activities={activities} userRole={userRole} />
        )}
      </main>
    </div>
  );
}
