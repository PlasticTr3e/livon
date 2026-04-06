import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const userId = req.headers.get('user-id'); 
    const { fullname, address } = await req.json();
    if (!userId) {
      return NextResponse.json({ message: "User ID wajib diisi" }, { status: 400 });
    }

    const updatedProfile = await prisma.citizenProfile.update({
      where: {
        userId: userId, 
      },
      data: {
        fullName: fullname, 
        address: address, 
      },
    });

    return NextResponse.json({
      message: "Profil berhasil diperbarui",
      data: updatedProfile,
    });

  } catch (error: unknown) {
    console.error("Update Profile Error:", error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      if ((error as { code: string }).code === 'P2025') {
        return NextResponse.json({ message: "Profil tidak ditemukan" }, { status: 404 });
      }
    }
    return NextResponse.json({ message: "Gagal memperbarui profil" }, { status: 500 });
  }
}