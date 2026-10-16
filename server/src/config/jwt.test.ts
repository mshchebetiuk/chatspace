import { signAccessToken, verifyAccessToken } from "./jwt.js";

const token = signAccessToken(1);
const userId = verifyAccessToken(token);

console.log("JWT verification:", userId === "1" ? "PASSED" : "FAILED");

try {
  verifyAccessToken("invalid.token.value");
  console.log("Invalid token rejection: FAILED");
} catch {
  console.log("Invalid token rejection: PASSED");
}
