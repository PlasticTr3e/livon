import prisma from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";

type BroadcastNotificationInput = {
  recipientRole: Role;
  title: string;
  type: string;
  message: string;
  projectId?: string;
  referenceId?: string;
};

export async function broadcastNotification({
  recipientRole,
  title,
  type,
  message,
  projectId,
  referenceId,
}: BroadcastNotificationInput) {
  return prisma.$transaction(async (tx) => {
    const recipients = await tx.user.findMany({
      where: {
        role: recipientRole,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (recipients.length === 0) {
      return { recipients: 0, created: 0 };
    }

    await tx.notification.createMany({
      data: recipients.map((recipient) => ({
        userId: recipient.id,
        projectId,
        referenceId,
        title,
        type,
        message,
      })),
    });

    return { recipients: recipients.length, created: recipients.length };
  });
}
