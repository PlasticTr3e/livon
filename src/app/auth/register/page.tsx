import { Suspense } from "react";
import { RegisterPageContent } from "@/components/register/RegisterPageContent";
import { LoadingState } from "@/components/shared/LoadingState";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <LoadingState
          label="Loading registration..."
          className="min-h-screen"
        />
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
