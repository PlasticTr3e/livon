import prisma from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";

type BroadcastNotificationInput = {
  title: string;
  type: string;
  message: string;
  projectId?: string;
  referenceId?: string;
} & (
  | { recipientRole: Role; recipientRoles?: never }
  | {
      recipientRole?: never;
      recipientRoles: Role[];
    }
);

export async function broadcastNotification({
  recipientRole,
  recipientRoles,
  title,
  type,
  message,
  projectId,
  referenceId,
}: BroadcastNotificationInput) {
  return prisma.$transaction(async (tx) => {
    const recipients = await tx.user.findMany({
      where: {
        role: recipientRoles ? { in: recipientRoles } : recipientRole,
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
