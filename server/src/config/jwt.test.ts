import { describe, it, expect } from "vitest";
import { signAccessToken, verifyAccessToken } from "./jwt.js";

describe("JWT utilities", () => {
  it("should sign and verify an access token", () => {
    const token = signAccessToken(1);
    const userId = verifyAccessToken(token);

    expect(userId).toBe("1");
  });

  it("should reject an invalid access token", () => {
    expect(() => verifyAccessToken("invalid")).toThrow();
  });
});
