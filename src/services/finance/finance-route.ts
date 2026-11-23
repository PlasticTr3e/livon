import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getAuthUser, type AuthPayload } from "@/lib/auth";
import { PaymentError } from "./payment-service";

export async function financeRoute(
  req: NextRequest,
  action: (user: AuthPayload) => Promise<unknown>,
) {
  try {
    const user = await getAuthUser(req);
    if (!user)
      return NextResponse.json(
        { success: false, message: "Silakan masuk kembali." },
        { status: 401 },
      );
    return NextResponse.json({ success: true, data: await action(user) });
  } catch (error) {
    if (error instanceof PaymentError)
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status },
      );
    if (error instanceof ZodError || error instanceof SyntaxError)
      return NextResponse.json(
        { success: false, message: "Rincian tidak valid. Periksa isian Anda." },
        { status: 400 },
      );
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    )
      return NextResponse.json(
        {
          success: false,
          message:
            "Pembayaran sedang diproses. Periksa riwayat sebelum mencoba lagi.",
        },
        { status: 409 },
      );
    console.error("Finance request failed", error);
    return NextResponse.json(
      {
        success: false,
        message: "Data keuangan belum dapat diakses. Silakan coba lagi.",
      },
      { status: 500 },
    );
  }
}
