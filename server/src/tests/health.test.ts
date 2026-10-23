import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app.js";

describe("GET /health", () => {
  it("should return HTTP 200", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
  });
});

describe("GET /unknown-route", () => {
  it("should return HTTP 404", async () => {
    const response = await request(app).get("/unknown-route");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Route not found");
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

describe("POST /auth/login with invalid JSON", () => {
  it("should return HTTP 400", async () => {
    const response = await request(app)
      .post("/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email":');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Invalid JSON body");
  });
});

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
