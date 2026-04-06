import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose"; 

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ message: "Email atau password salah" }, { status: 401 });
    }

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const token = await new SignJWT({ userId: user.id, role: user.role })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("24h")
  .sign(secret);

    return NextResponse.json({
      message: "Login Berhasil",
      token: token, 
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    }, { status: 200 });
} catch (error: any) {
  console.error("Login Error Detail :", error); 
  return NextResponse.json({ 
    message: "Gagal Login", 
    error: error.message 
  }, { status: 500 });
}}