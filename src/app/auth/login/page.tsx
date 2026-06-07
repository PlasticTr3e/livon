import { Suspense } from "react";
import { LoginPageContent } from "@/components/login/LoginPageContent";
import { LoadingState } from "@/components/shared/LoadingState";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <LoadingState label="Loading login..." className="min-h-screen" />
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
