import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateExcerpt } from "@/lib/ai";

export async function GET() {
  try {
    const newsItems = await prisma.news.findMany({ where: { deletedAt: null } });
    let count = 0;
    
    for (const item of newsItems) {
      if (item.content) {
        const excerpt = await generateExcerpt(item.content);
        await prisma.news.update({ where: { id: item.id }, data: { excerpt } });
        count++;
      }
    }
    
    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
