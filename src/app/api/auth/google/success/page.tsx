"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { LoadingState } from "@/components/shared/LoadingState";

function GoogleSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useUser();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      localStorage.setItem("livon-token", token);
      try {
        const payload = token.split(".")[1];
        const decodedPayload = JSON.parse(atob(payload));

        const userRole: "Resident" | "Manager" =
          decodedPayload.role === "WARGA" ? "Resident" : "Manager";

        login(userRole, decodedPayload.email);

        if (userRole === "Manager" || decodedPayload.role === "ADMIN") {
          router.push("/admin/users");
        } else {
          router.push("/map");
        }
      } catch {
        router.push("/auth/login?error=InvalidToken");
      }
    } else {
      router.push("/auth/login?error=NoToken");
    }
  }, [searchParams, router, login]);

  return (
    <LoadingState label="Masuk dengan Google..." className="min-h-screen" />
  );
}

export default function GoogleSuccessPage() {
  return (
    <Suspense
      fallback={<LoadingState label="Memuat..." className="min-h-screen" />}
    >
      <GoogleSuccessContent />
    </Suspense>
  );
}
