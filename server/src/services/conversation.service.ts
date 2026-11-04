import { prisma } from "../config/prisma.js";

type UnreadCountRow = {
  conversationId: number;
  unreadCount: bigint;
};

export async function markConversationAsRead(
  currentUserId: number,
  conversationId: number,
) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      userId_conversationId: {
        userId: currentUserId,
        conversationId,
      },
    },
  });

  if (!participant) return false;

  await prisma.conversationParticipant.update({
    where: {
      userId_conversationId: {
        userId: currentUserId,
        conversationId,
      },
    },
    data: {
      lastReadAt: new Date(),
    },
  });

  return true;
}

export async function getUserConversations(currentUserId: number) {
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: {
          userId: currentUserId,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      participants: {
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          userId: true,
          lastReadAt: true,
        },
      },
      messages: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 1,
        select: {
          id: true,
          content: true,
          senderId: true,
          createdAt: true,
        },
      },
    },
  });

  const unreadRows = await prisma.$queryRaw<UnreadCountRow[]>`
    SELECT 
      cp."conversationId",
      COUNT(m.id) AS "unreadCount"
    FROM "ConversationParticipant" cp 
    JOIN "Message" m 
      ON m."conversationId" = cp."conversationId"
    WHERE cp."userId" = ${currentUserId}
      AND m."senderId" <> cp."userId"
    AND (
      cp."lastReadAt" IS NULL
      OR m."createdAt" > cp."lastReadAt" 
    )
    GROUP BY cp."conversationId"
  `;

  const unreadCountMap = new Map<number, number>();

  for (const unreadRow of unreadRows) {
    const count = Number(unreadRow.unreadCount);
    unreadCountMap.set(unreadRow.conversationId, count);
  }

  const formattedConversations = conversations.map((conversation) => {
    const { messages, ...rest } = conversation;
    const unreadCount = unreadCountMap.get(conversation.id);

    return {
      ...rest,
      lastMessage: messages[0] ?? null,
      unreadCount: unreadCount ?? 0,
    };
  });

  return formattedConversations;
}
