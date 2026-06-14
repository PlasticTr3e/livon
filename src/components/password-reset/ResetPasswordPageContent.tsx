"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { apiFetchJson } from "@/lib/api-client";
import { useToast } from "@/components/shared/AppToaster";
import { LoginBrandMark } from "@/components/login/LoginBrandMark";
import { LoginHeroPanel } from "@/components/login/LoginHeroPanel";
import { PasswordInput } from "@/components/login/PasswordInput";

type ResetPasswordPayload = {
  token: string;
  password: string;
  confirmPassword: string;
};

export function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const token = searchParams.get("token") || "";

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData((currentData) => ({ ...currentData, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isLoading) return;

    if (!token) {
      toast.error("Invalid link", "Password reset token is missing.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(
        "Password mismatch",
        "Password and confirmation do not match.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const result = await apiFetchJson<ResetPasswordPayload, unknown>(
        "/api/auth/reset-password",
        "POST",
        {
          token,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        },
      );

      if (!result.success) {
        toast.error("Reset failed", result.message);
        return;
      }

      router.push("/auth/login?reset=true");
    } catch {
      toast.error("Reset failed", "Unable to reset password.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0B1120]">
      <div className="relative flex w-full flex-col justify-center bg-white px-10 py-16 dark:bg-[#111827] lg:w-[45%]">
        <div className="mx-auto w-full max-w-85">
          <LoginBrandMark className="mb-8 lg:hidden" />

          <h1 className="mb-2 text-[2.2rem] font-extrabold leading-tight text-gray-900 dark:text-white">
            Reset password
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-gray-400 dark:text-white">
            Create a new password for your LIVON account.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <PasswordInput
              value={formData.password}
              isVisible={isPasswordVisible}
              onChange={handleChange}
              onToggleVisibility={() =>
                setIsPasswordVisible((isVisible) => !isVisible)
              }
            />

            <PasswordInput
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              isVisible={isConfirmPasswordVisible}
              onChange={handleChange}
              onToggleVisibility={() =>
                setIsConfirmPasswordVisible((isVisible) => !isVisible)
              }
            />

            <button
              type="submit"
              disabled={isLoading || !token}
              className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-green-600 text-base font-bold text-white shadow-sm shadow-green-200 transition-all hover:bg-green-700 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-green-400 dark:shadow-green-900"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </button>

            {!token ? (
              <p className="text-center text-xs leading-relaxed text-red-500">
                This reset link is missing a token.
              </p>
            ) : null}

            <Link
              href="/auth/login"
              className="mt-2 text-center text-xs font-semibold text-green-600 hover:underline dark:text-green-400"
            >
              Back to login
            </Link>
          </form>
        </div>
      </div>

      <LoginHeroPanel activeImageIndex={0} />
    </div>
  );
}
