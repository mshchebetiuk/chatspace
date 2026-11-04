import type { Request, Response } from "express";
import { markConversationAsRead } from "../services/conversation.service.js";
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
