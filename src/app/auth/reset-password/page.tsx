import { Suspense } from "react";
import { ResetPasswordPageContent } from "@/components/password-reset/ResetPasswordPageContent";
import { LoadingState } from "@/components/shared/LoadingState";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <LoadingState
          label="Loading password reset..."
          className="min-h-screen"
        />
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  );
}
