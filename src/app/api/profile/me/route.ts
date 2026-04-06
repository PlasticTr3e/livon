import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('user-id'); 

    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        citizenProfile: true, 
        agencyProfile: true, 
      },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}