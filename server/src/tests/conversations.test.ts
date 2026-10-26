import { describe, it, expect } from "vitest";
import request from "supertest";

import { app } from "../app.js";

describe("POST /conversations/7/messages without JWT", () => {
  it("should return HTTP 401", async () => {
    const response = await request(app)
      .post("/conversations/7/messages")
      .send({ content: "Test message" });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Authentication required");
  });
});

describe("GET /conversations/7/messages with invalid JWT", () => {
  it("should reject invalid JWT", async () => {
    const response = await request(app)
      .get("/conversations/7/messages")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Invalid or expired token");
  });
});

describe("GET /conversations/7/messages", () => {
  it("should reject requests without JWT", async () => {
    const response = await request(app).get("/conversations/7/messages");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Authentication required");
  });
});
