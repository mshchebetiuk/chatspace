import express, { response } from "express";
import cors from "cors";

import { authRouter } from "./routes/auth.routes.js";
import { conversationRouter } from "./routes/conversation.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

import type { ApiResponse } from "./types/api.types.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth", authRouter);
app.use("/conversations", conversationRouter);

app.get("/health", (_req, res) => {
  const response: ApiResponse<{
    status: string;
    service: string;
  }> = {
    success: true,
    data: {
      status: "ok",
      service: "chatspace-api",
    },
  };

  res.status(200).json(response);
});

app.use((_req, res) => {
  const resposne: ApiResponse<never> = {
    success: false,
    error: "Route not found",
  };

  res.status(404).json(resposne);
});

app.use(errorHandler);
