"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { LoadingState } from "@/components/shared/LoadingState";
import { fetchSessionDisplayName } from "@/lib/app-shell/session-profile";

function GoogleSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useUser();

  useEffect(() => {
    async function finishGoogleLogin() {
      const token = searchParams.get("token");

      if (token) {
        localStorage.setItem("livon-token", token);
        try {
          const payload = token.split(".")[1];
          const decodedPayload = JSON.parse(atob(payload));

          const userRole = decodedPayload.role === "WARGA" ? "WARGA" : "AGENCY";
          const userName = await fetchSessionDisplayName(token);

          login(userRole, userName);

          if (userRole === "AGENCY") {
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
    }

    finishGoogleLogin();
  }, [searchParams, router, login]);

  return (
    <LoadingState label="Signing in with Google..." className="min-h-screen" />
  );
}

export default function GoogleSuccessPage() {
  return (
    <Suspense
      fallback={<LoadingState label="Loading..." className="min-h-screen" />}
    >
      <GoogleSuccessContent />
    </Suspense>
  );
}
