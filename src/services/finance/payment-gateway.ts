export type GatewayStatus = {
  order_id: string;
  gross_amount: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  currency?: string;
  transaction_id?: string;
  /** Virtual account: [{ bank: "bca", va_number: "..." }] */
  va_numbers?: { bank?: string; va_number?: string }[];
  permata_va_number?: string;
  bank?: string;
  issuer?: string;
  acquirer?: string;
  store?: string;
};

/** Bank / penerbit yang dipakai warga, diambil dari notifikasi Midtrans. */
export function gatewayPaymentBank(status: GatewayStatus): string | null {
  if (status.va_numbers?.[0]?.bank) return status.va_numbers[0].bank;
  if (status.permata_va_number) return "permata";
  if (status.payment_type === "echannel") return "mandiri";
  return (
    status.bank ??
    status.issuer ??
    status.acquirer ??
    status.store ??
    (status.payment_type === "gopay" || status.payment_type === "shopeepay"
      ? status.payment_type
      : null)
  );
}

export class GatewayError extends Error {
  constructor(readonly status: number) {
    super("Layanan pembayaran belum dapat dihubungi. Silakan coba lagi.");
  }
}

export interface PaymentGateway {
  create(input: {
    id: string;
    amount: number;
    title: string;
    payerName: string;
    email: string;
    createdAt: Date;
  }): Promise<{ token: string }>;
  status(id: string): Promise<GatewayStatus | null>;
}

async function request<T>(
  host: string,
  path: string,
  body?: unknown,
): Promise<T | null> {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new GatewayError(503);
  const response = await fetch(`https://${host}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  if (!body && response.status === 404) return null;
  if (!response.ok) throw new GatewayError(response.status);
  const result = (await response.json()) as T & { status_code?: string };
  const code = Number(result.status_code);
  if (!body && code === 404) return null;
  if (code >= 400) throw new GatewayError(code);
  return result;
}

function startTime(date: Date) {
  return (
    new Date(date.getTime() + 7 * 3600000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ") + " +0700"
  );
}

export const paymentGateway: PaymentGateway = {
  async create(input) {
    const production = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const result = await request<{ token: string }>(
      production ? "app.midtrans.com" : "app.sandbox.midtrans.com",
      "/snap/v1/transactions",
      {
        transaction_details: { order_id: input.id, gross_amount: input.amount },
        item_details: [
          {
            id: input.id,
            name: input.title.slice(0, 50),
            price: input.amount,
            quantity: 1,
          },
        ],
        customer_details: { first_name: input.payerName, email: input.email },
        expiry: {
          start_time: startTime(input.createdAt),
          duration: 24,
          unit: "hours",
        },
      },
    );
    if (!result?.token) throw new GatewayError(502);
    return result;
  },
  status(id) {
    const host =
      process.env.MIDTRANS_IS_PRODUCTION === "true"
        ? "api.midtrans.com"
        : "api.sandbox.midtrans.com";
    return request<GatewayStatus>(host, `/v2/${encodeURIComponent(id)}/status`);
  },
};
