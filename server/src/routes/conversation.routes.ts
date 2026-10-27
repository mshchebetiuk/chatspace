import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { messageRouter } from "./message.routes.js";

import { prisma } from "../config/prisma.js";
import { createConversationSchema } from "../validators/conversation.schema.js";
import { Prisma } from "../generated/prisma/client.js";
import type { ApiResponse } from "../types/api.types.js";

export const conversationRouter = Router();

conversationRouter.use(requireAuth);
conversationRouter.use("/:id/messages", messageRouter);

conversationRouter.get("/", async (req, res) => {
  const currentUserId = Number(res.locals.userId);

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

  const formattedConversations = conversations.map((conversation) => {
    const { messages, ...rest } = conversation;

    return {
      ...rest,
      lastMessage: messages[0] ?? null,
    };
  });

  type ConversationListData = typeof formattedConversations;

  const response: ApiResponse<ConversationListData> = {
    success: true,
    message: "Conversations fetched successfully",
    data: formattedConversations,
  };

  return res.status(200).json(response);
});

conversationRouter.post("/", async (req, res) => {
  const result = createConversationSchema.safeParse(req.body);

  if (!result.success) {
    const response: ApiResponse<never> = {
      success: false,
      error: "Validation failed",
    };

    return res.status(400).json(response);
  }

  const { participantId } = result.data;

  const currentUserId = Number(res.locals.userId);

  const privateUser1Id = Math.min(currentUserId, participantId);
  const privateUser2Id = Math.max(currentUserId, participantId);

  if (participantId === currentUserId) {
    const response: ApiResponse<never> = {
      success: false,
      error: "You cannot create a conversation with yourself",
    };

    return res.status(400).json(response);
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
    const response: ApiResponse<never> = {
      success: false,
      error: "Participant not found",
    };

    return res.status(404).json(response);
  }

  try {
    const conversation = await prisma.conversation.create({
      data: {
        privateUser1Id,
        privateUser2Id,
        participants: {
          create: [{ userId: currentUserId }, { userId: participantId }],
        },
      },
      include: {
        participants: {
          select: {
            userId: true,
            joinedAt: true,
          },
        },
      },
    });

    type CreateConversationData = {
      conversation: typeof conversation;
    };

    const response: ApiResponse<CreateConversationData> = {
      success: true,
      message: "Conversation created successfully",
      data: {
        conversation,
      },
    };

    return res.status(201).json(response);
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existingConversation = await prisma.conversation.findUnique({
        where: {
          privateUser1Id_privateUser2Id: {
            privateUser1Id,
            privateUser2Id,
          },
        },
        include: {
          participants: true,
        },
      });

      if (existingConversation) {
        type ExistingConversationData = {
          conversation: typeof existingConversation;
        };

        const response: ApiResponse<ExistingConversationData> = {
          success: true,
          message: "Conversation already exists",
          data: {
            conversation: existingConversation,
          },
        };

        return res.status(200).json(response);
      }
    }

    throw error;
  }
});
