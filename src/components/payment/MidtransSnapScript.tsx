import Script from "next/script";

const SNAP_SANDBOX_URL = "https://app.sandbox.midtrans.com/snap/snap.js";

/** Server component: reads the public Midtrans client key from the environment. */
export function MidtransSnapScript() {
  return (
    <Script
      src={SNAP_SANDBOX_URL}
      data-client-key={process.env.MIDTRANS_CLIENT_KEY}
      strategy="afterInteractive"
    />
  );
}
