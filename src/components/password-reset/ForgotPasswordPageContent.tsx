"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail } from "lucide-react";
import { apiFetchJson } from "@/lib/api-client";
import { useToast } from "@/components/shared/AppToaster";
import { LoginBrandMark } from "@/components/login/LoginBrandMark";
import { LoginHeroPanel } from "@/components/login/LoginHeroPanel";

type ForgotPasswordPayload = {
  email: string;
};

export function ForgotPasswordPageContent() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isLoading) return;

    setIsLoading(true);

    try {
      const result = await apiFetchJson<ForgotPasswordPayload, unknown>(
        "/api/auth/forgot-password",
        "POST",
        { email },
      );

      if (!result.success) {
        toast.error("Request failed", result.message);
        return;
      }

      setIsSubmitted(true);
      toast.success("Check your email", result.message);
    } catch {
      toast.error("Request failed", "Unable to request password reset.");
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
            Forgot password?
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-gray-400 dark:text-white">
            Enter your email and we&apos;ll send you a secure reset link.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 w-full rounded-full border border-gray-200 bg-slate-50 px-5 pr-12 text-sm text-gray-800 transition-colors placeholder:text-gray-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400 dark:border-gray-800 dark:bg-[#1F2937] dark:text-white dark:placeholder:text-slate-500"
                required
              />
              <Mail className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white" />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-green-600 text-base font-bold text-white shadow-sm shadow-green-200 transition-all hover:bg-green-700 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-green-400 dark:shadow-green-900"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>

            {isSubmitted ? (
              <p className="text-center text-xs leading-relaxed text-gray-400 dark:text-white">
                If the email exists, the reset link has been sent.
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
