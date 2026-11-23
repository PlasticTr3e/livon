"use client";
import { useLanguage } from "@/context/LanguageContext";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import type { ProfileRole, UserWithProfile } from "@/lib/profile/profile-types";

type ProfilePersonalInformationPanelProps = {
  isSaving: boolean;
  user: UserWithProfile;
  userRole: ProfileRole;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const inputClassName =
  "h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 sm:text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white";

const readOnlyInputClassName = cn(
  inputClassName,
  "bg-slate-100 text-slate-600 shadow-none dark:bg-slate-800 dark:text-slate-300",
);

const sectionClass =
  "min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900";

export function ProfilePersonalInformationPanel({
  isSaving,
  user,
  userRole,
  onSubmit,
}: ProfilePersonalInformationPanelProps) {
  const { t: translateUi } = useLanguage();

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className={sectionClass} aria-labelledby="profile-information">
          <h2
            id="profile-information"
            className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white"
          >
            <UserRound
              aria-hidden="true"
              className="size-5 text-green-700 dark:text-green-400"
            />
            {translateUi("Personal Information")}
          </h2>
          <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
            {userRole === "agency" ? (
              <AgencyProfileFields user={user} />
            ) : (
              <ResidentProfileFields user={user} />
            )}
          </div>
        </section>
        <PasswordFields />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-green-700 px-5 text-sm font-semibold text-white hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          {isSaving ? translateUi("Saving...") : translateUi("Save")}
        </button>
      </div>
    </form>
  );
}

function PasswordFields() {
  const { t: translateUi } = useLanguage();

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const passwordType = isPasswordVisible ? "text" : "password";

  return (
    <section className={sectionClass} aria-labelledby="profile-password">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          id="profile-password"
          className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white"
        >
          <LockKeyhole
            aria-hidden="true"
            className="size-5 text-green-700 dark:text-green-400"
          />
          {translateUi("Password")}
        </h2>
        <button
          type="button"
          onClick={() => setIsPasswordVisible((current) => !current)}
          className="grid size-11 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label={
            isPasswordVisible
              ? translateUi("Hide passwords")
              : translateUi("Show passwords")
          }
        >
          {isPasswordVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      <div className="space-y-4">
        <ProfileField label={translateUi("Current Password")}>
          <input
            name="currentPassword"
            type={passwordType}
            autoComplete="current-password"
            className={inputClassName}
          />
        </ProfileField>
        <ProfileField label={translateUi("New Password")}>
          <input
            name="newPassword"
            type={passwordType}
            autoComplete="new-password"
            minLength={6}
            className={inputClassName}
          />
        </ProfileField>
        <ProfileField label={translateUi("Confirm New Password")}>
          <input
            name="confirmPassword"
            type={passwordType}
            autoComplete="new-password"
            minLength={6}
            className={inputClassName}
          />
        </ProfileField>
      </div>
    </section>
  );
}

function AgencyProfileFields({ user }: { user: UserWithProfile }) {
  const { t: translateUi } = useLanguage();

  return (
    <>
      <ProfileField label={translateUi("Agency Name")}>
        <input
          name="agencyName"
          defaultValue={user.agencyProfile?.agencyName || ""}
          className={inputClassName}
        />
      </ProfileField>
      <ProfileField label={translateUi("Email Address")}>
        <input
          type="email"
          value={user.email}
          readOnly
          className={readOnlyInputClassName}
        />
      </ProfileField>
      <ProfileField label={translateUi("Phone Number")}>
        <input
          name="phone"
          defaultValue={user.agencyProfile?.phone || ""}
          inputMode="numeric"
          maxLength={13}
          className={inputClassName}
        />
      </ProfileField>
      <ProfileField label={translateUi("Agency Address")}>
        <input
          name="address"
          defaultValue={user.agencyProfile?.address || ""}
          readOnly
          className={readOnlyInputClassName}
        />
      </ProfileField>
    </>
  );
}

function ResidentProfileFields({ user }: { user: UserWithProfile }) {
  const { t: translateUi } = useLanguage();

  return (
    <>
      <ProfileField label={translateUi("Full Name")}>
        <input
          name="fullName"
          defaultValue={user.citizenProfile?.fullName || user.name || ""}
          className={inputClassName}
        />
      </ProfileField>
      <ProfileField label={translateUi("Email Address")}>
        <input
          type="email"
          value={user.email}
          readOnly
          className={readOnlyInputClassName}
        />
      </ProfileField>
      <ProfileField label={translateUi("Phone Number")}>
        <input
          name="phone"
          defaultValue={user.citizenProfile?.phone || user.phone || ""}
          inputMode="numeric"
          maxLength={13}
          className={inputClassName}
        />
      </ProfileField>
      <div className="grid grid-cols-2 gap-3">
        <ProfileField label={translateUi("House Block")}>
          <input
            name="blokRumah"
            defaultValue={
              user.citizenProfile?.blockHouse || user.blokRumah || ""
            }
            readOnly
            className={readOnlyInputClassName}
          />
        </ProfileField>
        <ProfileField label={translateUi("House Number")}>
          <input
            name="noRumah"
            defaultValue={
              user.citizenProfile?.houseNumber || user.noRumah || ""
            }
            readOnly
            className={readOnlyInputClassName}
          />
        </ProfileField>
      </div>
      <ProfileField label={translateUi("National Identity Number (NIK)")}>
        <input
          type="text"
          value={user.citizenProfile?.nik || ""}
          readOnly
          className={readOnlyInputClassName}
        />
      </ProfileField>
      <ProfileField label={translateUi("Family card Number (KK)")}>
        <input
          type="text"
          value={user.citizenProfile?.kkNumber || ""}
          readOnly
          className={readOnlyInputClassName}
        />
      </ProfileField>
    </>
  );
}

function ProfileField({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </span>
      {children}
    </label>
  );
}
