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

describe("POST /unknown-route", () => {
  it("should return HTTP 404", async () => {
    const response = await request(app)
      .post("/unknown-route")
      .send({ message: "Hello" });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Route not found");
  });
});
