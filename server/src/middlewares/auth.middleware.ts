import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../config/jwt.js";
import type { ApiResponse } from "../types/api.types.js";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    const response: ApiResponse<never> = {
      success: false,
      error: "Authentication required",
    };

    return res.status(401).json(response);
  }

  const token = authorization.slice(7);

  if (!token) {
    const response: ApiResponse<never> = {
      success: false,
      error: "Authentication required",
    };

    return res.status(401).json(response);
  }

  try {
    const userId = verifyAccessToken(token);
    res.locals.userId = userId;

    next();
  } catch {
    const response: ApiResponse<never> = {
      success: false,
      error: "Invalid or expired token",
    };

    return res.status(401).json(response);
  }
};
