import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { messageRouter } from "./message.routes.js";

import { prisma } from "../config/prisma.js";
import { createConversationSchema } from "../validators/conversation.schema.js";
import { Prisma } from "../generated/prisma/client.js";

export const conversationRouter = Router();

conversationRouter.use(requireAuth);
conversationRouter.use("/:id/messages", messageRouter);

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

  const privateUser1Id = Math.min(currentUserId, participantId);
  const privateUser2Id = Math.max(currentUserId, participantId);

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

    return res.status(201).json({
      message: "Conversation created successfully",
      conversation,
    });
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
        return res.status(200).json({
          message: "Conversation already exists",
          conversation: existingConversation,
        });
      }
    }

    throw error;
  }
});
