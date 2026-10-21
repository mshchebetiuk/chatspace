import express from "express";
import cors from "cors";

import { authRouter } from "./routes/auth.routes.js";
import { conversationRouter } from "./routes/conversation.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth", authRouter);
app.use("/conversations", conversationRouter);

app.get("/health", (_req, res) => {
  return res.status(200).json({
    status: "ok",
    service: "chatspace-api",
  });
});

app.use((_req, res) => {
  return res.status(404).json({
    error: "Route not found",
  });
});

app.use(errorHandler);
