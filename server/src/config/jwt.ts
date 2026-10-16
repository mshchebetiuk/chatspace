import "dotenv/config";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters");
}

export const signAccessToken = (userId: number): string => {
  return jwt.sign({ sub: String(userId) }, jwtSecret, {
    expiresIn: "15m",
    algorithm: "HS256",
  });
};

export const verifyAccessToken = (token: string) => {
  const payload = jwt.verify(token, jwtSecret, {
    algorithms: ["HS256"],
  });

  if (typeof payload === "string" || typeof payload.sub !== "string") {
    throw new Error("Invalid token payload");
  }

  return payload.sub;
};
