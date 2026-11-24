import type { NextRequest } from "next/server";
import {
  assignIplBills,
  assignIplSchema,
} from "@/services/finance/admin-billing";
import { adminFinanceRoute } from "@/services/finance/admin-finance-route";

export const dynamic = "force-dynamic";

/** Terbitkan tagihan IPL (dengan rincian) untuk warga terpilih atau semua warga. */
export async function POST(req: NextRequest) {
  return adminFinanceRoute(req, async () =>
    assignIplBills(assignIplSchema.parse(await req.json())),
  );
}
