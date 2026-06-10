"use client";

import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, Save } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import type { ProfileRole, UserWithProfile } from "@/lib/profile/profile-types";
import { ProfileSectionHeader } from "./ProfileSectionHeader";

type ProfilePersonalInformationPanelProps = {
  isSaving: boolean;
  user: UserWithProfile;
  userRole: ProfileRole;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const inputClassName =
  "h-12 w-full rounded-xl border border-gray-200 bg-white px-5 text-sm text-gray-800 transition focus:outline-none focus:ring-2 focus:ring-green-400 dark:border-gray-800 dark:bg-[#1F2937] dark:text-white";

const readOnlyInputClassName = cn(
  inputClassName,
  "cursor-not-allowed select-none bg-slate-100 text-gray-500 dark:bg-slate-800 dark:text-white",
);

export function ProfilePersonalInformationPanel({
  isSaving,
  user,
  userRole,
  onSubmit,
}: ProfilePersonalInformationPanelProps) {
  return (
    <div className="max-w-xl">
      <ProfileSectionHeader
        title="Personal Information"
        description="Manage your account details and preferences."
      />

      <form onSubmit={onSubmit} className="space-y-5">
        {userRole === "agency" ? (
          <AgencyProfileFields user={user} />
        ) : (
          <ResidentProfileFields user={user} />
        )}

        <ProfileField label="Account Status">
          <div className="flex h-12 items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-5">
            <CheckCircle2 className="h-4 w-4 text-green-700" />
            <span className="text-sm font-semibold text-green-700">
              Verified
            </span>
          </div>
        </ProfileField>

        <PasswordFields />

        <button
          type="submit"
          disabled={isSaving}
          className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Save className="h-4 w-4" /> {isSaving ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}

function PasswordFields() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const passwordType = isPasswordVisible ? "text" : "password";

  return (
    <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Password
        </h3>
        <button
          type="button"
          onClick={() => setIsPasswordVisible((current) => !current)}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-slate-100 hover:text-green-600 dark:hover:bg-slate-800"
          aria-label={isPasswordVisible ? "Hide passwords" : "Show passwords"}
        >
          {isPasswordVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      <div className="space-y-4">
        <ProfileField label="Current Password">
          <input
            name="currentPassword"
            type={passwordType}
            autoComplete="current-password"
            className={inputClassName}
          />
        </ProfileField>
        <ProfileField label="New Password">
          <input
            name="newPassword"
            type={passwordType}
            autoComplete="new-password"
            minLength={6}
            className={inputClassName}
          />
        </ProfileField>
        <ProfileField label="Confirm New Password">
          <input
            name="confirmPassword"
            type={passwordType}
            autoComplete="new-password"
            minLength={6}
            className={inputClassName}
          />
        </ProfileField>
      </div>
    </div>
  );
}

function AgencyProfileFields({ user }: { user: UserWithProfile }) {
  return (
    <>
      <ProfileField label="Agency Name">
        <input
          name="agencyName"
          defaultValue={user.agencyProfile?.agencyName || ""}
          className={inputClassName}
        />
      </ProfileField>
      <ProfileField label="Email Address">
        <input
          type="email"
          value={user.email}
          readOnly
          className={readOnlyInputClassName}
        />
      </ProfileField>
      <ProfileField label="Phone Number">
        <input
          name="phone"
          defaultValue={user.agencyProfile?.phone || ""}
          className={inputClassName}
        />
      </ProfileField>
      <ProfileField label="Agency Address">
        <input
          name="address"
          defaultValue={user.agencyProfile?.address || ""}
          className={inputClassName}
        />
      </ProfileField>
    </>
  );
}

function ResidentProfileFields({ user }: { user: UserWithProfile }) {
  return (
    <>
      <ProfileField label="Full Name">
        <input
          name="fullName"
          defaultValue={user.citizenProfile?.fullName || user.name || ""}
          className={inputClassName}
        />
      </ProfileField>
      <ProfileField label="Email Address">
        <input
          type="email"
          value={user.email}
          readOnly
          className={readOnlyInputClassName}
        />
      </ProfileField>
      <ProfileField label="Phone Number">
        <input
          name="phone"
          defaultValue={user.citizenProfile?.phone || user.phone || ""}
          className={inputClassName}
        />
      </ProfileField>
      <ProfileField label="National Identity Number (NIK)">
        <input
          type="text"
          value={user.citizenProfile?.nik || ""}
          readOnly
          className={readOnlyInputClassName}
        />
      </ProfileField>
      <ProfileField label="Family card Number (KK)">
        <input
          type="text"
          value={user.citizenProfile?.kkNumber || ""}
          readOnly
          className={readOnlyInputClassName}
        />
      </ProfileField>
      <div className="flex gap-3">
        <ProfileField className="flex-1" label="House Block">
          <input
            name="blokRumah"
            defaultValue={
              user.citizenProfile?.blockHouse || user.blokRumah || ""
            }
            className={inputClassName}
          />
        </ProfileField>
        <ProfileField className="w-32" label="House Number">
          <input
            name="noRumah"
            defaultValue={
              user.citizenProfile?.houseNumber || user.noRumah || ""
            }
            className={inputClassName}
          />
        </ProfileField>
      </div>
    </>
  );
}

function ProfileField({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </label>
      {children}
    </div>
  );
}
