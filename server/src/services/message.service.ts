import { prisma } from "../config/prisma.js";

export async function getConversationMessages(
  conversationId: number,
  limit: number,
  cursor: number | undefined,
  userId: number,
) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new RangeError("Invalid message limit");
  }

  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    throw new RangeError("Invalid conversation ID");
  }

  if (cursor !== undefined && (!Number.isInteger(cursor) || cursor <= 0)) {
    throw new RangeError("Invalid message cursor");
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new RangeError("Invalid user ID");
  }

  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      userId_conversationId: {
        userId,
        conversationId,
      },
    },
  });

  if (participant === null) {
    throw new Error("Access denied");
  }

  return prisma.message.findMany({
    where: {
      conversationId,
    },
    orderBy: {
      id: "desc",
    },
    take: limit,

    ...(cursor !== undefined ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
}
