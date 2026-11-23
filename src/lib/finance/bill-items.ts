/** One line of an IPL bill breakdown, e.g. { label: "Keamanan", amount: 150000 }. */
export type BillItemLine = { label: string; amount: number };

export const DEFAULT_BILL_ITEM_LABEL = "Iuran Pengelolaan Lingkungan";

/**
 * Reads `resident_bills.items` (JSON written by the admin "Terbitkan IPL" form).
 * Bills issued without a breakdown fall back to a single line with the total.
 */
export function parseBillItems(value: unknown, total: number): BillItemLine[] {
  if (Array.isArray(value)) {
    const items = value
      .map((item) =>
        item && typeof item === "object"
          ? {
              label: String((item as { label?: unknown }).label ?? "").trim(),
              amount: Number((item as { amount?: unknown }).amount ?? 0),
            }
          : null,
      )
      .filter(
        (item): item is BillItemLine =>
          !!item && item.label.length > 0 && Number.isFinite(item.amount),
      );
    if (items.length) return items;
  }
  return [{ label: DEFAULT_BILL_ITEM_LABEL, amount: total }];
}
