"use client";

import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { LanguageSwitch } from "@/components/shared/LanguageSwitch";
import type {
  RegisterFormData,
  RegisterFormErrors,
} from "@/lib/register/register-types";
import { RegisterBrandMark } from "./RegisterBrandMark";
import { RegisterDivider } from "./RegisterDivider";
import { RegisterGoogleButton } from "./RegisterGoogleButton";
import { RegisterPasswordInput } from "./RegisterPasswordInput";
import { RegisterResidentFields } from "./RegisterResidentFields";
import { RegisterTextInput } from "./RegisterTextInput";

type RegisterFormPanelProps = {
  formData: RegisterFormData;
  errors: RegisterFormErrors;
  prefilledEmail: string;
  isPasswordVisible: boolean;
  isConfirmPasswordVisible: boolean;
  isSubmitDisabled?: boolean;
  onFieldChange: (field: keyof RegisterFormData, value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onTogglePasswordVisibility: () => void;
  onToggleConfirmPasswordVisibility: () => void;
};

export function RegisterFormPanel({
  formData,
  errors,
  prefilledEmail,
  isPasswordVisible,
  isConfirmPasswordVisible,
  isSubmitDisabled = false,
  onFieldChange,
  onSubmit,
  onTogglePasswordVisibility,
  onToggleConfirmPasswordVisibility,
}: RegisterFormPanelProps) {
  const { t: translateUi } = useLanguage();

  return (
    <div className="relative flex w-full flex-col justify-center overflow-y-auto bg-white px-10 py-20 dark:bg-[#111827] lg:w-[45%]">
      <div className="absolute right-6 top-6">
        <LanguageSwitch />
      </div>
      <div className="mx-auto w-full max-w-[340px]">
        <RegisterBrandMark className="mb-6 lg:hidden" />

        <h1 className="mb-2 text-[2.4rem] font-extrabold leading-tight text-gray-900 dark:text-white">
          {translateUi("Join Now!")}
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-gray-400 dark:text-white">
          {translateUi("Join your neighborhood community on LIVON.")}
          <br />
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <RegisterTextInput
            type="text"
            placeholder={translateUi("Full name")}
            value={formData.fullName}
            onChange={(event) => onFieldChange("fullName", event.target.value)}
            error={errors.fullName}
          />

          <RegisterTextInput
            type="email"
            placeholder={translateUi("Email address")}
            value={formData.email}
            onChange={(event) => onFieldChange("email", event.target.value)}
            error={errors.email}
            readOnly={Boolean(prefilledEmail)}
            className={prefilledEmail ? "cursor-not-allowed opacity-70" : ""}
          />

          <RegisterPasswordInput
            placeholder={translateUi("Password")}
            value={formData.password}
            error={errors.password}
            isVisible={isPasswordVisible}
            onChange={(value) => onFieldChange("password", value)}
            onToggleVisibility={onTogglePasswordVisibility}
          />

          <RegisterPasswordInput
            placeholder={translateUi("Confirm password")}
            value={formData.confirmPassword}
            error={errors.confirmPassword}
            isVisible={isConfirmPasswordVisible}
            onChange={(value) => onFieldChange("confirmPassword", value)}
            onToggleVisibility={onToggleConfirmPasswordVisibility}
          />

          <RegisterTextInput
            type="tel"
            placeholder={translateUi("Phone")}
            value={formData.phone}
            onChange={(event) => onFieldChange("phone", event.target.value)}
            error={errors.phone}
            required
          />

          <RegisterResidentFields
            formData={formData}
            errors={errors}
            onFieldChange={onFieldChange}
          />

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="mt-1 h-12 w-full rounded-full bg-green-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {translateUi("Register")}
          </button>

          <RegisterDivider />
          <RegisterGoogleButton />

          <p className="mt-1 text-center text-xs text-gray-400">
            {translateUi("Already have an account?")}{" "}
            <Link
              href="./login"
              className="font-semibold text-green-600 hover:underline"
            >
              {translateUi("Login")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
