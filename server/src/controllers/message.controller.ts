import { type Request, type Response } from "express";
import type { ApiResponse } from "../types/api.types.js";
import { getConversationMessages } from "../services/message.service.js";

export async function getConversationMessagesController(
  req: Request,
  res: Response,
) {
  const conversationId = Number(req.params.id);
  const currentUserId = Number(res.locals.userId);
  const limit = Number(req.query.limit ?? 20);

  if (!Number.isSafeInteger(conversationId) || conversationId <= 0) {
    const response: ApiResponse<never> = {
      success: false,
      error: "Invalid conversation ID",
    };

    return res.status(400).json(response);
  }

  if (!Number.isSafeInteger(currentUserId) || currentUserId <= 0) {
    const response: ApiResponse<never> = {
      success: false,
      error: "Authentication required",
    };

    return res.status(401).json(response);
  }

  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    const response: ApiResponse<never> = {
      success: false,
      error: "Invalid pagination parameters",
    };

    return res.status(400).json(response);
  }

  const rawCursor = req.query.cursor;
  let cursor: number | undefined;

  if (rawCursor !== undefined) {
    if (typeof rawCursor !== "string") {
      const response: ApiResponse<never> = {
        success: false,
        error: "Invalid cursor",
      };

      return res.status(400).json(response);
    }

    if (!/^[0-9]+$/.test(rawCursor)) {
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

  const messages = await getConversationMessages(
    conversationId,
    limit,
    cursor,
    currentUserId,
  );

  const response: ApiResponse<typeof messages> = {
    success: true,
    data: messages,
  };

  return res.status(200).json(response);
}
