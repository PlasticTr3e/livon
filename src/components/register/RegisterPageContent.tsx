"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useToast } from "@/components/shared/AppToaster";
import {
  createRegisterFormData,
  createRegisterPayload,
  hasRegisterErrors,
  validateRegisterForm,
} from "@/lib/register/register-form";
import { REGISTER_HERO_IMAGES } from "@/lib/register/register-copy";
import type {
  RegisterFormData,
  RegisterFormErrors,
} from "@/lib/register/register-types";
import { RegisterFormPanel } from "./RegisterFormPanel";
import { RegisterHeroPanel } from "./RegisterHeroPanel";

export function RegisterPageContent() {
  const router = useRouter();
  const toast = useToast();
  const [emailQuery] = useQueryState("email", parseAsString);
  const [nameQuery] = useQueryState("name", parseAsString);

  const prefilledEmail = emailQuery || "";
  const prefilledName = nameQuery || "";

  const [formData, setFormData] = useState(() =>
    createRegisterFormData(prefilledEmail, prefilledName),
  );
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [activeHeroImageIndex, setActiveHeroImageIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveHeroImageIndex(
        (currentIndex) => (currentIndex + 1) % REGISTER_HERO_IMAGES.length,
      );
    }, 3000);

    return () => window.clearInterval(interval);
  }, []);

  function handleFieldChange(field: keyof RegisterFormData, value: string) {
    setFormData((currentData) => ({ ...currentData, [field]: value }));
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();

    const validationErrors = validateRegisterForm(formData);
    setErrors(validationErrors);
    if (hasRegisterErrors(validationErrors)) return;

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createRegisterPayload(formData)),
      });
      const result = await response.json();

      if (!response.ok) {
        const errorMessage =
          result.message || result.error || "Registration failed";
        setErrors({
          general: errorMessage,
        });
        toast.error("Registration failed", errorMessage);
        return;
      }

      router.push("/auth/login?registered=true");
    } catch (error) {
      console.error("REGISTER ERROR", error);
      const errorMessage = "Network error. Please try again.";
      setErrors({ general: errorMessage });
      toast.error("Registration failed", errorMessage);
    }
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0B1120]">
      <RegisterFormPanel
        formData={formData}
        errors={errors}
        prefilledEmail={prefilledEmail}
        isPasswordVisible={isPasswordVisible}
        isConfirmPasswordVisible={isConfirmPasswordVisible}
        onFieldChange={handleFieldChange}
        onSubmit={handleRegister}
        onTogglePasswordVisibility={() =>
          setIsPasswordVisible((isVisible) => !isVisible)
        }
        onToggleConfirmPasswordVisibility={() =>
          setIsConfirmPasswordVisible((isVisible) => !isVisible)
        }
      />
      <RegisterHeroPanel activeImageIndex={activeHeroImageIndex} />
    </div>
  );
}
