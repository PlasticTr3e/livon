import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, fullname, role } = await req.json();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "Email sudah ada" }, { status: 400 });
    }

    let finalRole: "AGENCY" | "CITIZEN";
    if (role === "AGENCY") {
      finalRole = "AGENCY";
    } else {
      finalRole = "CITIZEN"; 
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: finalRole, 
        citizenProfile: {
          create: { 
            fullName: fullname, 
            isVerified: false, 
            address: "" 
          }
        }
      }
    });

    return NextResponse.json(
      { message: "Registrasi Berhasil", userId: user.id, role: user.role }, 
      { status: 201 }
    );

  } catch (error) {
    console.error("Error Register:", error);
    return NextResponse.json({ message: "Gagal Registrasi" }, { status: 500 });
  }
}