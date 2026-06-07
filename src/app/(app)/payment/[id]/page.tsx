import { Suspense } from "react";
import Script from "next/script";
import { PaymentPageContent } from "@/components/payment/PaymentPageContent";
import { LoadingState } from "@/components/shared/LoadingState";

export default function PaymentPage() {
  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key="Mid-client-hathFuuCoigDRQ3Q"
        strategy="lazyOnload"
      />
      <Suspense
        fallback={
          <LoadingState label="Loading payment..." className="h-full" />
        }
      >
        <PaymentPageContent />
      </Suspense>
    </>
  );
}
