import { prisma } from "../config/prisma.js";
import { Prisma } from "../generated/prisma/client.js";

type UnreadCountRow = {
  conversationId: number;
  unreadCount: bigint;
};

type ConversationWithParticipants = Prisma.ConversationGetPayload<{
  include: {
    participants: {
      select: {
        userId: true;
        joinedAt: true;
      };
    };
  };
}>;

type CreateConversationResult =
  | { status: "SELF_CONVERSATION" }
  | { status: "PARTICIPANT_NOT_FOUND" }
  | { status: "CREATED"; conversation: ConversationWithParticipants }
  | { status: "EXISTING"; conversation: ConversationWithParticipants };

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

const conversationInclude = {
  participants: true,
} as const satisfies Prisma.ConversationInclude;

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function createConversation(
  currentUserId: number,
  participantId: number,
): Promise<CreateConversationResult> {
  if (currentUserId === participantId) {
    return { status: "SELF_CONVERSATION" };
  }

  const participant = await prisma.user.findUnique({
    where: {
      id: participantId,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!participant) {
    return { status: "PARTICIPANT_NOT_FOUND" };
  }

  const privateUser1Id = Math.min(currentUserId, participantId);
  const privateUser2Id = Math.max(currentUserId, participantId);

  try {
    const conversation = await prisma.conversation.create({
      data: {
        privateUser1Id,
        privateUser2Id,
        participants: {
          create: [{ userId: currentUserId }, { userId: participantId }],
        },
      },
      include: conversationInclude,
    });

    return { status: "CREATED", conversation };
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      const existingConversation = await prisma.conversation.findUnique({
        where: {
          privateUser1Id_privateUser2Id: {
            privateUser1Id,
            privateUser2Id,
          },
        },
        include: conversationInclude,
      });

      if (existingConversation) {
        return { status: "EXISTING", conversation: existingConversation };
      }
    }

    throw error;
  }
}
