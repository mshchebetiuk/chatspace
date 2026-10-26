import { describe, it, expect } from "vitest";
import request from "supertest";

import { app } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../config/jwt.js";
import jwt from "jsonwebtoken";

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

describe("GET /auth/me invalid Authorization", () => {
  it("should return HTTP 401", async () => {
    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", "Basic abc123");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Authentication required");
  });
});

describe("GET /auth/me invalid Authorization Bearer", () => {
  it("should return HTTP 401", async () => {
    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", "bearer invalid-token");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Authentication required");
  });
});

describe("GET /auth/me with damaged signature", () => {
  it("should return HTTP 401", async () => {
    const token = signAccessToken(1);

    const parts = token.split(".");
    const signature = parts[2];

    if (!signature) throw new Error("JWT signature is missing");

    const replacement = signature[0] === "A" ? "B" : "A";
    parts[2] = replacement + signature.slice(1);

    const tamperedToken = parts.join(".");

    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${tamperedToken}`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Invalid or expired token");
  });
});

describe("GET /auth/me with damaged Payload", () => {
  it("should return HTTP 401", async () => {
    const token = signAccessToken(1);

    const parts = token.split(".");
    const payload = parts[1];

    if (typeof payload === "undefined" || !payload)
      throw new Error("JWT payload is missing");

    const replacement = payload[0] === "A" ? "B" : "A";
    parts[1] = replacement + payload.slice(1);

    const tamperedToken = parts.join(".");

    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${tamperedToken}`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Invalid or expired token");
  });
});

describe("GET /auth/me with expired JWT", () => {
  it("should return HTTP 401", async () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is missing");

    const expiredToken = jwt.sign({ userId: "1" }, secret, { expiresIn: -10 });

    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Invalid or expired token");
  });
});

describe("GET /auth/me JWT without expiration", () => {
  it("should return HTTP 200", async () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is missing");

    const payloadToken = jwt.sign({ sub: "1" }, secret);

    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${payloadToken}`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Invalid or expired token");
  });
});
