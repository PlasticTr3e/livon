import Script from "next/script";

const SNAP_URL =
  process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

/** Server component: reads the public Midtrans client key from the environment. */
export function MidtransSnapScript() {
  return (
    <Script
      src={SNAP_URL}
      data-client-key={process.env.MIDTRANS_CLIENT_KEY}
      strategy="afterInteractive"
    />
  );
}
