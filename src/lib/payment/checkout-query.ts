import {
  DONATION_MAX,
  DONATION_MESSAGE_MAX,
  DONATION_MIN,
  PAYMENT_ROUTES,
} from "./billing";

/** Donation choices carried from the donation form to the checkout page via the URL. */
export type DonationCheckoutDetails = {
  amount: number;
  anonymous: boolean;
  message: string;
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function buildDonationCheckoutHref(details: DonationCheckoutDetails) {
  const query = new URLSearchParams({ jumlah: String(details.amount) });
  if (details.anonymous) query.set("anonim", "1");

  const message = details.message.trim();
  if (message) query.set("pesan", message.slice(0, DONATION_MESSAGE_MAX));

  return `${PAYMENT_ROUTES.donationCheckout}?${query.toString()}`;
}

/** Returns null when the amount is missing or out of range. */
export function parseDonationCheckoutQuery(
  searchParams: SearchParams,
): DonationCheckoutDetails | null {
  const amount = Number(firstValue(searchParams.jumlah));
  if (
    !Number.isInteger(amount) ||
    amount < DONATION_MIN ||
    amount > DONATION_MAX
  ) {
    return null;
  }

  return {
    amount,
    anonymous: firstValue(searchParams.anonim) === "1",
    message: (firstValue(searchParams.pesan) ?? "")
      .trim()
      .slice(0, DONATION_MESSAGE_MAX),
  };
}
