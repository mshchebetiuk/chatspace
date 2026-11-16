import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app.js";

describe("GET /conversations/:id/messages", () => {
  it("should return HTTP 401 without JWT", async () => {
    const response = await request(app).get("/conversations/1/messages");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should return HTTP 401 with invalid JWT", async () => {
    const response = await request(app)
      .get("/conversations/1/messages")
      .set("Authorization", "Bearer Invalid-token");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
