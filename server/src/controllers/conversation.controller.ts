import type { Request, Response } from "express";
import {
  markConversationAsRead,
  getUserConversations,
  createConversation,
} from "../services/conversation.service.js";
import { createConversationSchema } from "../validators/conversation.schema.js";
import type { ApiResponse } from "../types/api.types.js";

export async function markConversationAsReadController(
  req: Request,
  res: Response,
) {
  const currentUserId = Number(res.locals.userId);
  const conversationId = Number(req.params.conversationId);

  if (
    !Number.isSafeInteger(currentUserId) ||
    !Number.isSafeInteger(conversationId) ||
    currentUserId <= 0 ||
    conversationId <= 0
  ) {
    const response: ApiResponse<never> = {
      success: false,
      error: "Invalid conversation ID",
    };

    return res.status(400).json(response);
  }

  const isMarked = await markConversationAsRead(currentUserId, conversationId);

  if (!isMarked) {
    const response: ApiResponse<never> = {
      success: false,
      error: "Conversation not found",
    };

    return res.status(404).json(response);
  }

  const response: ApiResponse<null> = {
    success: true,
    message: "Conversation marked as read",
    data: null,
  };

  return res.status(200).json(response);
}

export async function getUserConversationsController(
  req: Request,
  res: Response,
) {
  const currentUserId = Number(res.locals.userId);
  const conversations = await getUserConversations(currentUserId);

  type ConversationListData = typeof conversations;

  const response: ApiResponse<ConversationListData> = {
    success: true,
    message: "Conversations fetched successfully",
    data: conversations,
  };

  return res.status(200).json(response);
}

export async function createConversationController(
  req: Request,
  res: Response,
) {
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

  const serviceResult = await createConversation(currentUserId, participantId);

  if (serviceResult.status === "SELF_CONVERSATION") {
    const response: ApiResponse<never> = {
      success: false,
      error: "You cannot create a conversation with yourself",
    };

    return res.status(400).json(response);
  }

  if (serviceResult.status === "PARTICIPANT_NOT_FOUND") {
    const response: ApiResponse<never> = {
      success: false,
      error: "Participant not found",
    };

    return res.status(404).json(response);
  }

  if (serviceResult.status === "CREATED") {
    type CreateConversationData = {
      conversation: typeof serviceResult.conversation;
    };

    const response: ApiResponse<CreateConversationData> = {
      success: true,
      message: "Conversation created successfully",
      data: {
        conversation: serviceResult.conversation,
      },
    };

    return res.status(201).json(response);
  }

  if (serviceResult.status === "EXISTING") {
    type ExistingConversationData = {
      conversation: typeof serviceResult.conversation;
    };

    const response: ApiResponse<ExistingConversationData> = {
      success: true,
      message: "Conversation already exists",
      data: {
        conversation: serviceResult.conversation,
      },
    };

    return res.status(200).json(response);
  }
}
