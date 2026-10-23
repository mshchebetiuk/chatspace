import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { createMessageSchema } from "../validators/message.schema.js";
import { prisma } from "../config/prisma.js";
import type { ApiResponse } from "../types/api.types.js";

export const messageRouter = Router({
  mergeParams: true,
});

messageRouter.use(requireAuth);

messageRouter.post<{ id: string }>("/", async (req, res) => {
  const result = createMessageSchema.safeParse(req.body);

  if (!result.success) {
    const response: ApiResponse<never> = {
      success: false,
      error: "Validation failed",
    };

    return res.status(400).json(response);
  }

  const { content } = result.data;

  const rawConversationId = req.params.id;
  const conversationId = Number(rawConversationId);

  if (!Number.isSafeInteger(conversationId) || conversationId <= 0) {
    const response: ApiResponse<never> = {
      success: false,
      error: "Invalid conversation ID",
    };

    return res.status(400).json(response);
  }

  const conversation = await prisma.conversation.findUnique({
    where: {
      id: conversationId,
    },
    select: {
      id: true,
    },
  });

  if (!conversation) {
    const response: ApiResponse<never> = {
      success: false,
      error: "Conversation not found",
    };

    return res.status(404).json(response);
  }

  const currentUserId = Number(res.locals.userId);

  const membership = await prisma.conversationParticipant.findUnique({
    where: {
      userId_conversationId: {
        userId: currentUserId,
        conversationId,
      },
    },
  });

  if (!membership) {
    const response: ApiResponse<never> = {
      success: false,
      error: "You are not a participant of this conversation",
    };

    return res.status(403).json(response);
  }

  const message = await prisma.$transaction(async (tx) => {
    const newMessage = await tx.message.create({
      data: {
        content,
        senderId: currentUserId,
        conversationId,
      },
      select: {
        id: true,
        content: true,
        senderId: true,
        conversationId: true,
        createdAt: true,
      },
    });

    await tx.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return newMessage;
  });

  type CreateMessageData = typeof message;

  const response: ApiResponse<CreateMessageData> = {
    success: true,
    message: "Message created successfully",
    data: message,
  };

  return res.status(201).json(response);
});

messageRouter.get<{ id: string }>("/", async (req, res) => {
  const conversationId = Number(req.params.id);
  const currentUserId = Number(res.locals.userId);

  if (!Number.isSafeInteger(conversationId) || conversationId <= 0) {
    const response: ApiResponse<never> = {
      success: false,
      error: "Invalid conversation ID",
    };

    return res.status(400).json(response);
  }

  const membership = await prisma.conversationParticipant.findUnique({
    where: {
      userId_conversationId: {
        userId: currentUserId,
        conversationId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!membership) {
    const response: ApiResponse<never> = {
      success: false,
      error: "You are not a participant of this conversation",
    };

    return res.status(403).json(response);
  }

  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);

  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    const response: ApiResponse<never> = {
      success: false,
      error: "Invalid pagination parameters",
    };

    return res.status(400).json(response);
  }

  const skip = (page - 1) * limit;

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      content: true,
      senderId: true,
      conversationId: true,
      createdAt: true,
    },
  });

  const total = await prisma.message.count({
    where: {
      conversationId,
    },
  });

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  type MessageListData = {
    messages: typeof messages;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  const response: ApiResponse<MessageListData> = {
    success: true,
    message: "Messages fetched successfully",
    data: {
      messages: messages,
      total: total,
      totalPages: totalPages,
      hasNextPage: hasNextPage,
      hasPreviousPage: hasPreviousPage,
    },
  };

  return res.status(200).json(response);
});
