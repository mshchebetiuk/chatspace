import { Router } from "express";
import { registerSchema } from "../validators/auth.schema.js";

export const authRouter = Router();

authRouter.post("/register", (req, res) => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  return res.status(501).json({
    error: "Validation passed. Registration is not implemented yet",
  });
});
