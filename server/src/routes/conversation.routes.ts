import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { messageRouter } from "./message.routes.js";

import {
  markConversationAsReadController,
  getUserConversationsController,
  createConversationController,
} from "../controllers/conversation.controller.js";

export const conversationRouter = Router();

conversationRouter.use(requireAuth);
conversationRouter.use("/:id/messages", messageRouter);

conversationRouter.get("/", getUserConversationsController);
conversationRouter.post("/", createConversationController);

conversationRouter.patch(
  "/:conversationId/read",
  markConversationAsReadController,
);
