import type { ErrorRequestHandler } from "express";
import type { ApiResponse } from "../types/api.types.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === 400
  ) {
    const response: ApiResponse<never> = {
      success: false,
      error: "Invalid JSON body",
    };

    res.status(400).json(response);
    return;
  }

  if (error instanceof Error && error.message === "Access denied") {
    const response: ApiResponse<never> = {
      success: false,
      error: "Access denied",
    };

    return res.status(403).json(response);
  }

  console.error("Unhandled API error:", error);

  const response: ApiResponse<never> = {
    success: false,
    error: "Internal server error",
  };

  res.status(500).json(response);
};
