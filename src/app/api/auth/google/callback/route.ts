import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=OAuthFailed`,
    );
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: "http://localhost:3000/api/auth/google/callback",
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();

    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      },
    );
    const googleUser = await userRes.json();

    if (!googleUser.email) throw new Error("No email found");

    const user = await prisma.user.findUnique({
      where: { email: googleUser.email },
      include: { citizenProfile: true, agencyProfile: true },
    });

    if (!user) {
      const qs = new URLSearchParams({
        email: googleUser.email,
        name: googleUser.name || "",
        picture: googleUser.picture || "",
      });
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/register?${qs.toString()}`,
      );
    }

    const isWargaVerified = user.citizenProfile?.isVerified === true;
    const isAgencyVerified = user.agencyProfile?.isVerified === true;
    const isAdmin = user.role !== "WARGA" && user.role !== "AGENCY"; // Asumsi jika ada role Admin

    if (!isWargaVerified && !isAgencyVerified && !isAdmin) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?registered=true`,
      );
    }

    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" },
    );

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/success?token=${jwtToken}`,
    );
  } catch (error) {
    console.error("OAuth Error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=OAuthFailed`,
    );
  }
}
