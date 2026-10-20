import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { createMessageSchema } from "../validators/message.schema.js";
import { prisma } from "../config/prisma.js";

export const messageRouter = Router({
  mergeParams: true,
});

messageRouter.use(requireAuth);

messageRouter.post<{ id: string }>("/", async (req, res) => {
  const result = createMessageSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  const { content } = result.data;

  const rawConversationId = req.params.id;
  const conversationId = Number(rawConversationId);

  if (!Number.isSafeInteger(conversationId) || conversationId <= 0) {
    return res.status(400).json({
      error: "Invalid conversation ID",
    });
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
    return res.status(404).json({
      error: "Conversation not found",
    });
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
    return res.status(403).json({
      error: "You are not a participant of this conversation",
    });
  }

  const message = await prisma.message.create({
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

  return res.status(201).json({
    message: "Message created successfully",
    data: message,
  });
});
