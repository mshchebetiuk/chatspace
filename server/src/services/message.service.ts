import { prisma } from "../config/prisma.js";

export async function getConversationMessages(
  conversationId: number,
  limit: number,
  cursor?: number,
) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new RangeError("Invalid message limit");
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
