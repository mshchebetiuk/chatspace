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
