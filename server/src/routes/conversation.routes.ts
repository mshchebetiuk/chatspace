import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";

import { prisma } from "../config/prisma.js";
import { createConversationSchema } from "../validators/conversation.schema.js";

export const conversationRouter = Router();

conversationRouter.use(requireAuth);

conversationRouter.post("/", async (req, res) => {
  const result = createConversationSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  const { participantId } = result.data;

  const currentUserId = Number(res.locals.userId);

  if (participantId === currentUserId) {
    return res.status(400).json({
      error: "You cannot create a conversation with yourself",
    });
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
    return res.status(404).json({
      error: "Participant not found",
    });
  }

  const conversation = await prisma.conversation.create({
    data: {
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

  return res.status(201).json({
    message: "Conversation created successfully",
    conversation,
  });
});
