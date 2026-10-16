import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../config/jwt.js";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  const token = authorization.slice(7);

  if (!token) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  try {
    const userId = verifyAccessToken(token);
    res.locals.userId = userId;

    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
};
