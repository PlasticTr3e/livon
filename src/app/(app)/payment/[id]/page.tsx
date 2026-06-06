import { Suspense } from "react";
import Script from "next/script";
import { PaymentPageContent } from "@/components/payment/PaymentPageContent";

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
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
          </div>
        }
      >
        <PaymentPageContent />
      </Suspense>
    </>
  );
}
