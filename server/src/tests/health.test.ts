import { describe, it, expect } from "vitest";
import request from "supertest";

import { app } from "../app.js";
import { signAccessToken } from "../config/jwt.js";

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

describe("POST /auth/register with invalid email", () => {
  it("should return HTTP 400", async () => {
    const response = await request(app).post("/auth/register").send({
      name: "Test User",
      email: "invalid-email",
      password: "SecurePass123",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Validation failed");
  });
});

describe("POST /auth/login with invalid email", () => {
  it("should return HTTP 400", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "invalid-email",
      password: "SecurePass123",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Validation failed");
  });
});

describe("POST /auth/register with short password", () => {
  it("should return HTTP 400", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send({ name: "Test User", email: "test@example.com", password: "123" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Validation failed");
  });
});

describe("POST /auth/register with short name", () => {
  it("should return HTTP 400", async () => {
    const response = await request(app).post("/auth/register").send({
      name: "A",
      email: "test@example.com",
      password: "SecurePass123",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Validation failed");
  });
});

describe("POST /auth/register with empty body", () => {
  it("should return HTTP 400", async () => {
    const response = await request(app).post("/auth/register").send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Validation failed");
  });
});

describe("POST /auth/login with empty body", () => {
  it("should return HTTP 400", async () => {
    const response = await request(app).post("/auth/login").send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Validation failed");
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

describe("GET /auth/me without JWT", () => {
  it("should return HTTP 401", async () => {
    const response = await request(app).get("/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Authentication required");
  });
});

describe("GET /auth/me invalid JWT", () => {
  it("should return HTTP 401", async () => {
    const response = await request(app)
      .get("/auth/me")
      .set({ Authorization: "Bearer invalid-token" });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Invalid or expired token");
  });
});

describe("GET /auth/me with valid JWT", () => {
  it("should return HTTP 200", async () => {
    const token = signAccessToken(1);

    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.userId).toBe("1");
  });
});

describe("GET /auth/me without Bearer prefix", () => {
  it("should return HTTP 401", async () => {
    const token = signAccessToken(1);

    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", token);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Authentication required");
  });
});

describe("GET /auth/me with empty Bearer token", () => {
  it("should return HTTP 401", async () => {
    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", "Bearer ");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Authentication required");
  });
});
