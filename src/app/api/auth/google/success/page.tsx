"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";

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
    <div className="text-center flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-600 font-medium">Masuk dengan Google...</p>
    </div>
  );
}

export default function GoogleSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Suspense fallback={<div>Memuat...</div>}>
        <GoogleSuccessContent />
      </Suspense>
    </div>
  );
}
