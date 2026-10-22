import { Router } from "express";
import { registerSchema, loginSchema } from "../validators/auth.schema.js";
import { prisma } from "../config/prisma.js";
import bcrypt from "bcrypt";
import { Prisma } from "../generated/prisma/client.js";
import { signAccessToken } from "../config/jwt.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { loginRateLimit } from "../middlewares/login-rate-limit.middleware.js";
import type { ApiResponse } from "../types/api.types.js";

type LoginData = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
};

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten(),
    });
  }

  const { email } = result.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    const { name } = result.data;
    const { password } = result.data;

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

authRouter.post("/login", loginRateLimit, async (req, res) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    const response: ApiResponse<never> = {
      success: false,
      error: "Validation failed",
    };

    return res.status(400).json(response);
  }

  const { email } = result.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Invalid email or password",
      };

      return res.status(401).json(response);
    }

    const isPasswordValid = await bcrypt.compare(
      result.data.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Invalid email or password",
      };

      return res.status(401).json(response);
    }

    const accessToken = signAccessToken(user.id);

    const response: ApiResponse<LoginData> = {
      success: true,
      data: {
        accessToken,
        tokenType: "Bearer",
        expiresIn: 900,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      message: "Login successful",
    };

    return res.status(200).json(response);
  } catch (error: unknown) {
    console.error("Login error:", error);

    const response: ApiResponse<never> = {
      success: false,
      error: "Internal server error",
    };

    return res.status(500).json(response);
  }
});

authRouter.get("/me", requireAuth, (_req, res) => {
  const userId = res.locals.userId as string;

  const response: ApiResponse<{ userId: string }> = {
    success: true,
    data: {
      userId,
    },
    message: "Authenticated successfully",
  };

  return res.status(200).json(response);
});
