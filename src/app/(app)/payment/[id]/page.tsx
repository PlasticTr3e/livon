import { notFound } from "next/navigation";
import { CheckoutPageContent } from "@/components/payment/CheckoutPageContent";
import { MidtransSnapScript } from "@/components/payment/MidtransSnapScript";
import { getCheckoutKindFromSlug } from "@/lib/payment/billing";
import { parseDonationCheckoutQuery } from "@/lib/payment/checkout-query";

type PaymentPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** `/payment/ipl` and `/payment/donasi`: IPL & community donation checkout. */
export default async function PaymentPage({
  params,
  searchParams,
}: PaymentPageProps) {
  const kind = getCheckoutKindFromSlug((await params).id);
  if (!kind) notFound();

  const donation =
    kind === "donation" ? parseDonationCheckoutQuery(await searchParams) : null;

  return (
    <>
      <MidtransSnapScript />
      <CheckoutPageContent kind={kind} donation={donation} />
    </>
  );
}
