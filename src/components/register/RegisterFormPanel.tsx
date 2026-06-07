import Link from "next/link";
import type {
  RegisterFormData,
  RegisterFormErrors,
  RegisterRole,
} from "@/lib/register/register-types";
import { RegisterAgencyFields } from "./RegisterAgencyFields";
import { RegisterBrandMark } from "./RegisterBrandMark";
import { RegisterDivider } from "./RegisterDivider";
import { RegisterGoogleButton } from "./RegisterGoogleButton";
import { RegisterPasswordInput } from "./RegisterPasswordInput";
import { RegisterResidentFields } from "./RegisterResidentFields";
import { RegisterRoleSelector } from "./RegisterRoleSelector";
import { RegisterTextInput } from "./RegisterTextInput";

type RegisterFormPanelProps = {
  formData: RegisterFormData;
  errors: RegisterFormErrors;
  prefilledEmail: string;
  isPasswordVisible: boolean;
  isConfirmPasswordVisible: boolean;
  onFieldChange: (field: keyof RegisterFormData, value: string) => void;
  onRoleChange: (role: RegisterRole) => void;
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
  onFieldChange,
  onRoleChange,
  onSubmit,
  onTogglePasswordVisibility,
  onToggleConfirmPasswordVisibility,
}: RegisterFormPanelProps) {
  const isResident = formData.role === "WARGA";
  const isAgency = formData.role === "AGENCY";

  return (
    <div className="flex w-full flex-col justify-center overflow-y-auto bg-white px-10 py-10 dark:bg-[#111827] lg:w-[45%]">
      <div className="mx-auto w-full max-w-[340px]">
        <RegisterBrandMark className="mb-6 lg:hidden" />

        <h1 className="mb-2 text-[2.4rem] font-extrabold leading-tight text-gray-900 dark:text-white">
          Join Now!
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-gray-400 dark:text-white">
          Join your neighborhood community on LIVON.
          <br />
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <RegisterTextInput
            type="text"
            placeholder="Full name"
            value={formData.fullName}
            onChange={(event) => onFieldChange("fullName", event.target.value)}
            error={errors.fullName}
          />

          <RegisterTextInput
            type="email"
            placeholder="Email address"
            value={formData.email}
            onChange={(event) => onFieldChange("email", event.target.value)}
            error={errors.email}
            readOnly={Boolean(prefilledEmail)}
            className={prefilledEmail ? "cursor-not-allowed opacity-70" : ""}
          />

          <RegisterPasswordInput
            placeholder="Password"
            value={formData.password}
            error={errors.password}
            isVisible={isPasswordVisible}
            onChange={(value) => onFieldChange("password", value)}
            onToggleVisibility={onTogglePasswordVisibility}
          />

          <RegisterPasswordInput
            placeholder="Confirm password"
            value={formData.confirmPassword}
            error={errors.confirmPassword}
            isVisible={isConfirmPasswordVisible}
            onChange={(value) => onFieldChange("confirmPassword", value)}
            onToggleVisibility={onToggleConfirmPasswordVisibility}
          />

          <RegisterTextInput
            type="tel"
            placeholder="Phone"
            value={formData.phone}
            onChange={(event) => onFieldChange("phone", event.target.value)}
            error={errors.phone}
            required
          />

          <RegisterRoleSelector value={formData.role} onChange={onRoleChange} />

          {isResident && (
            <RegisterResidentFields
              formData={formData}
              errors={errors}
              onFieldChange={onFieldChange}
            />
          )}

          {isAgency && (
            <RegisterAgencyFields
              formData={formData}
              errors={errors}
              onFieldChange={onFieldChange}
            />
          )}

          <button
            type="submit"
            className="mt-1 h-12 w-full rounded-full bg-green-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
          >
            Register
          </button>

          <RegisterDivider />
          <RegisterGoogleButton />

          <p className="mt-1 text-center text-xs text-gray-400">
            Already have an account?{" "}
            <Link
              href="./login"
              className="font-semibold text-green-600 hover:underline"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
