import { prisma } from "../config/prisma.js";

export async function getConversationMessages(
  conversationId: number,
  limit: number,
  cursor?: number,
) {
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
