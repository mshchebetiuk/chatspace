import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  createMessageSchema,
  updateMessageSchema,
} from "../validators/message.schema.js";
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

  const currentUserId = Number(res.locals.userId);

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
      error: "Conversation not found",
    };

    return res.status(404).json(response);
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
      error: "Conversation not found",
    };

    return res.status(404).json(response);
  }

  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const skip = (page - 1) * limit;

  const rawCursor = req.query.cursor;
  const rawMode = req.query.mode;

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

  if (!Number.isSafeInteger(skip) || skip > 2_147_483_647) {
    const response: ApiResponse<never> = {
      success: false,
      error: "Invalid pagination parameters",
    };

    return res.status(400).json(response);
  }

  let cursor: number | undefined;

  if (rawCursor !== undefined) {
    if (typeof rawCursor !== "string" || !/^\d+$/.test(rawCursor)) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Invalid cursor",
      };
      return res.status(400).json(response);
    }

    const parsedCursor = Number(rawCursor);

    if (!Number.isSafeInteger(parsedCursor) || parsedCursor <= 0) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Invalid cursor",
      };
      return res.status(400).json(response);
    }

    cursor = parsedCursor;
  }

  if (rawMode !== undefined && rawMode !== "cursor" && rawMode !== "offset") {
    const response: ApiResponse<never> = {
      success: false,
      error: "Invalid pagination mode",
    };

    return res.status(400).json(response);
  }

  if (rawMode === "offset" && cursor !== undefined) {
    const response: ApiResponse<never> = {
      success: false,
      error: "Conflicting pagination parameters",
    };

    return res.status(400).json(response);
  }

  const paginationMode: "offset" | "cursor" =
    cursor !== undefined || rawMode === "cursor" ? "cursor" : "offset";

  if (cursor !== undefined) {
    const cursorMessage = await prisma.message.findFirst({
      where: {
        id: cursor,
        conversationId,
      },
      select: {
        id: true,
      },
    });

    if (!cursorMessage) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Invalid cursor",
      };

      return res.status(400).json(response);
    }
  }

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
    },
    ...(cursor !== undefined ? { cursor: { id: cursor } } : {}),
    skip: cursor !== undefined ? 1 : paginationMode === "cursor" ? 0 : skip,
    take: paginationMode === "cursor" ? limit + 1 : limit,
    orderBy:
      paginationMode === "cursor"
        ? [{ createdAt: "desc" }, { id: "desc" }]
        : [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      content: true,
      senderId: true,
      conversationId: true,
      createdAt: true,
    },
  });

  const hasMore = paginationMode === "cursor" && messages.length > limit;
  const paginatedMessages =
    paginationMode === "cursor" ? messages.slice(0, limit) : messages;

  const lastMessage = paginatedMessages.at(-1);
  const nextCursor = hasMore === true ? (lastMessage?.id ?? null) : null;

  const total = await prisma.message.count({
    where: {
      conversationId,
    },
  });

  // Offset pagination metadata
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  type MessageListData = {
    messages: typeof messages;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    hasMore?: boolean;
    nextCursor?: number | null;
  };

  const response: ApiResponse<MessageListData> = {
    success: true,
    message: "Messages fetched successfully",
    data: {
      messages: paginatedMessages,
      total: total,
      totalPages: totalPages,
      hasNextPage: hasNextPage,
      hasPreviousPage: hasPreviousPage,
      hasMore,
      nextCursor,
    },
  };

  return res.status(200).json(response);
});

messageRouter.patch<{ id: string; messageId: string }>(
  "/:messageId",
  async (req, res) => {
    const result = updateMessageSchema.safeParse(req.body);

    if (!result.success) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Validation failed",
      };

      return res.status(400).json(response);
    }

    const conversationId = Number(req.params.id);
    const messageId = Number(req.params.messageId);

    if (
      !Number.isSafeInteger(conversationId) ||
      !Number.isSafeInteger(messageId) ||
      messageId <= 0 ||
      conversationId <= 0
    ) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Invalid conversation or message ID",
      };

      return res.status(400).json(response);
    }

    const currentUserId = Number(res.locals.userId);

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
        error: "Conversation not found",
      };

      return res.status(404).json(response);
    }

    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversationId,
        senderId: currentUserId,
      },
      select: {
        id: true,
      },
    });

    if (!message) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Message not found",
      };

      return res.status(404).json(response);
    }

    const updatedMessage = await prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        content: result.data.content,
      },
      select: {
        id: true,
        content: true,
        senderId: true,
        conversationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    type UpdateMessageData = typeof updatedMessage;

    const response: ApiResponse<UpdateMessageData> = {
      success: true,
      message: "Message updated successfully",
      data: updatedMessage,
    };

    return res.status(200).json(response);
  },
);

messageRouter.delete<{ id: string; messageId: string }>(
  "/:messageId",
  async (req, res) => {
    const conversationId = Number(req.params.id);
    const messageId = Number(req.params.messageId);

    if (
      !Number.isSafeInteger(conversationId) ||
      !Number.isSafeInteger(messageId) ||
      messageId <= 0 ||
      conversationId <= 0
    ) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Invalid conversation or message ID",
      };

      return res.status(400).json(response);
    }

    const currentUserId = Number(res.locals.userId);

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
        error: "Conversation not found",
      };

      return res.status(404).json(response);
    }

    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversationId,
        senderId: currentUserId,
      },
      select: {
        id: true,
      },
    });

    if (!message) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Message not found",
      };

      return res.status(404).json(response);
    }

    const deletedMessage = await prisma.message.delete({
      where: {
        id: messageId,
      },
    });

    const response: ApiResponse<{ id: number }> = {
      success: true,
      message: "Message deleted successfully",
      data: {
        id: deletedMessage.id,
      },
    };

    return res.status(200).json(response);
  },
);
