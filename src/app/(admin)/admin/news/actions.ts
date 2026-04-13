"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteNewsAction(id: string) {
  try {
    // Delete directly using Prisma
    await prisma.news.delete({
      where: { id },
    });
    revalidatePath("/admin/news");
    return { success: true };
  } catch (error: unknown) {
    console.error("Delete news error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete news";
    return { success: false, message };
  }
}

export async function updateNewsAction(
  id: string,
  data: { title: string; content?: string; thumbnailUrl?: string },
) {
  try {
    const updated = await prisma.news.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        thumbnailUrl: data.thumbnailUrl,
      },
    });
    revalidatePath("/admin/news");
    return { success: true, data: updated };
  } catch (error: unknown) {
    console.error("Update news error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update news";
    return { success: false, message };
  }
}
