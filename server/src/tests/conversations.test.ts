import { describe, it, expect, vi } from "vitest";
import request from "supertest";

import { app } from "../app.js";
import { signAccessToken } from "../config/jwt.js";
import { prisma } from "../config/prisma.js";

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

describe("GET /conversations/7/messages authenticated non-participant", () => {
  it("should return HTTP 404", async () => {
    const membershipSpy = vi
      .spyOn(prisma.conversationParticipant, "findUnique")
      .mockResolvedValueOnce(null);

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations/7/messages")
        .set("Authorization", `Bearer ${token}`);

      // console.log("STATUS:", response.status);
      // console.log("BODY:", response.body);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Conversation not found");
    } finally {
      membershipSpy.mockRestore();
    }
  });
});

describe("GET /conversations/7/messages authenticated participant", () => {
  it("should return HTTP 200", async () => {
    const membershipSpy = vi
      .spyOn(prisma.conversationParticipant, "findUnique")
      .mockResolvedValueOnce({
        id: 1,
        userId: 1,
        conversationId: 7,
        joinedAt: new Date(),
      });

    const messagesSpy = vi
      .spyOn(prisma.message, "findMany")
      .mockResolvedValueOnce([]);

    const countSpy = vi.spyOn(prisma.message, "count").mockResolvedValueOnce(0);

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations/7/messages")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toEqual([]);
      expect(response.body.data.total).toBe(0);
      expect(response.body.data.totalPages).toBe(0);
    } finally {
      membershipSpy.mockRestore();
      messagesSpy.mockRestore();
      countSpy.mockRestore();
    }
  });
});

describe("GET /conversations/7/messages pagination metadata", () => {
  it("should return HTTP 200", async () => {
    const membershipSpy = vi
      .spyOn(prisma.conversationParticipant, "findUnique")
      .mockResolvedValueOnce({
        id: 1,
        userId: 1,
        conversationId: 7,
        joinedAt: new Date(),
      });

    const messagesSpy = vi
      .spyOn(prisma.message, "findMany")
      .mockResolvedValueOnce([]);

    const countSpy = vi
      .spyOn(prisma.message, "count")
      .mockResolvedValueOnce(45);

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations/7/messages?page=2&limit=20")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toEqual([]);
      expect(response.body.data.total).toBe(45);
      expect(response.body.data.totalPages).toBe(3);
      expect(response.body.data.hasNextPage).toBe(true);
      expect(response.body.data.hasPreviousPage).toBe(true);
    } finally {
      membershipSpy.mockRestore();
      messagesSpy.mockRestore();
      countSpy.mockRestore();
    }
  });
});

describe("GET /conversations/7/messages with invalid page", () => {
  it("should return HTTP 400", async () => {
    const membershipSpy = vi
      .spyOn(prisma.conversationParticipant, "findUnique")
      .mockResolvedValueOnce({
        id: 1,
        userId: 1,
        conversationId: 7,
        joinedAt: new Date(),
      });

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations/7/messages?page=0&limit=20")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid pagination parameters");
    } finally {
      membershipSpy.mockRestore();
    }
  });
});

describe("GET /conversations/7/messages with invalid limit", () => {
  it("should return HTTP 400", async () => {
    const membershipSpy = vi
      .spyOn(prisma.conversationParticipant, "findUnique")
      .mockResolvedValueOnce({
        id: 1,
        userId: 1,
        conversationId: 7,
        joinedAt: new Date(),
      });

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations/7/messages?page=1&limit=0")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid pagination parameters");
    } finally {
      membershipSpy.mockRestore();
    }
  });
});

describe("GET /conversations/7/messages with limit exceeding maximum", () => {
  it("should return HTTP 400", async () => {
    const membershipSpy = vi
      .spyOn(prisma.conversationParticipant, "findUnique")
      .mockResolvedValueOnce({
        id: 1,
        userId: 1,
        conversationId: 7,
        joinedAt: new Date(),
      });

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations/7/messages?page=1&limit=101")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid pagination parameters");
    } finally {
      membershipSpy.mockRestore();
    }
  });
});

describe("GET /conversations/7/messages with fractional page", () => {
  it("should return HTTP 400", async () => {
    const membershipSpy = vi
      .spyOn(prisma.conversationParticipant, "findUnique")
      .mockResolvedValueOnce({
        id: 1,
        userId: 1,
        conversationId: 7,
        joinedAt: new Date(),
      });

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations/7/messages?page=1.5&limit=20")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid pagination parameters");
    } finally {
      membershipSpy.mockRestore();
    }
  });
});

describe("GET /conversations/7/messages with fractional limit", () => {
  it("should return HTTP 400", async () => {
    const membershipSpy = vi
      .spyOn(prisma.conversationParticipant, "findUnique")
      .mockResolvedValueOnce({
        id: 1,
        userId: 1,
        conversationId: 7,
        joinedAt: new Date(),
      });

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations/7/messages?page=1&limit=2.5")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid pagination parameters");
    } finally {
      membershipSpy.mockRestore();
    }
  });
});

describe("GET /conversations/abc/messages with invalid conversation ID", () => {
  it("should return HTTP 400", async () => {
    const token = signAccessToken(1);

    const response = await request(app)
      .get("/conversations/abc/messages")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Invalid conversation ID");
  });
});

describe("GET /conversations/0/messages with invalid conversation ID", () => {
  it("should return HTTP 400", async () => {
    const token = signAccessToken(1);

    const response = await request(app)
      .get("/conversations/0/messages")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Invalid conversation ID");
  });
});

describe("GET /conversations/-5/messages with invalid conversation ID", () => {
  it("should return HTTP 400", async () => {
    const token = signAccessToken(1);

    const response = await request(app)
      .get("/conversations/-5/messages")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Invalid conversation ID");
  });
});

describe("GET /conversations/9007199254740992/messages with unsafe integer ID", () => {
  it("should return HTTP 400", async () => {
    const token = signAccessToken(1);

    const response = await request(app)
      .get("/conversations/9007199254740992/messages")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Invalid conversation ID");
  });
});

describe("GET /conversations/abc/messages should not query membership", () => {
  it("should return HTTP 400", async () => {
    const membershipSpy = vi
      .spyOn(prisma.conversationParticipant, "findUnique")
      .mockResolvedValueOnce({
        id: 1,
        userId: 1,
        conversationId: 7,
        joinedAt: new Date(),
      });

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations/abc/messages")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid conversation ID");
      expect(membershipSpy).not.toHaveBeenCalled();
    } finally {
      membershipSpy.mockRestore();
    }
  });
});

describe("GET /conversations/7/messages should check membership once", () => {
  it("should return HTTP 404", async () => {
    const membershipSpy = vi
      .spyOn(prisma.conversationParticipant, "findUnique")
      .mockResolvedValueOnce(null);

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations/7/messages")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Conversation not found");
      expect(membershipSpy).toHaveBeenCalledTimes(1);
      expect(membershipSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_conversationId: {
              userId: 1,
              conversationId: 7,
            },
          },
        }),
      );
    } finally {
      membershipSpy.mockRestore();
    }
  });
});

describe("GET /conversations/7/messages should not fetch messages for non-participant", () => {
  it("should return HTTP 404", async () => {
    const membershipSpy = vi
      .spyOn(prisma.conversationParticipant, "findUnique")
      .mockResolvedValueOnce(null);

    const messagesSpy = vi.spyOn(prisma.message, "findMany");

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations/7/messages")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Conversation not found");
      expect(messagesSpy).not.toHaveBeenCalled();
    } finally {
      membershipSpy.mockRestore();
      messagesSpy.mockRestore();
    }
  });
});

describe("GET /conversations/7/messages should use correct pagination param", () => {
  it("should return HTTP 200", async () => {
    const membershipSpy = vi
      .spyOn(prisma.conversationParticipant, "findUnique")
      .mockResolvedValueOnce({
        id: 1,
        userId: 1,
        conversationId: 7,
        joinedAt: new Date(),
      });

    const messagesSpy = vi
      .spyOn(prisma.message, "findMany")
      .mockResolvedValueOnce([]);

    const countSpy = vi
      .spyOn(prisma.message, "count")
      .mockResolvedValueOnce(25);

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations/7/messages?page=3&limit=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(messagesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { conversationId: 7 },
          skip: 20,
          take: 10,
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        }),
      );
      expect(response.body.data.total).toBe(25);
      expect(response.body.data.totalPages).toBe(3);
      expect(response.body.data.hasNextPage).toBe(false);
      expect(response.body.data.hasPreviousPage).toBe(true);
    } finally {
      membershipSpy.mockRestore();
      messagesSpy.mockRestore();
      countSpy.mockRestore();
    }
  });
});

describe("GET /conversations/7/messages should use default pagination", () => {
  it("should return HTTP 200", async () => {
    const membershipSpy = vi
      .spyOn(prisma.conversationParticipant, "findUnique")
      .mockResolvedValueOnce({
        id: 1,
        userId: 1,
        conversationId: 7,
        joinedAt: new Date(),
      });

    const messagesSpy = vi
      .spyOn(prisma.message, "findMany")
      .mockResolvedValueOnce([]);

    const countSpy = vi.spyOn(prisma.message, "count").mockResolvedValueOnce(0);

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations/7/messages")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(messagesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { conversationId: 7 },
          skip: 0,
          take: 20,
        }),
      );
    } finally {
      membershipSpy.mockRestore();
      messagesSpy.mockRestore();
      countSpy.mockRestore();
    }
  });
});

describe("GET /conversations/7/messages should accept maximum limit", () => {
  it("should return HTTP 200", async () => {
    const membershipSpy = vi
      .spyOn(prisma.conversationParticipant, "findUnique")
      .mockResolvedValueOnce({
        id: 1,
        userId: 1,
        conversationId: 7,
        joinedAt: new Date(),
      });

    const messagesSpy = vi
      .spyOn(prisma.message, "findMany")
      .mockResolvedValueOnce([]);

    const countSpy = vi
      .spyOn(prisma.message, "count")
      .mockResolvedValueOnce(100);

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations/7/messages?page=1&limit=100")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(messagesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { conversationId: 7 },
          skip: 0,
          take: 100,
        }),
      );
    } finally {
      membershipSpy.mockRestore();
      messagesSpy.mockRestore();
      countSpy.mockRestore();
    }
  });
});

describe("GET /conversations/7/messages should return message data", () => {
  it("should return HTTP 200", async () => {
    const membershipSpy = vi
      .spyOn(prisma.conversationParticipant, "findUnique")
      .mockResolvedValueOnce({
        id: 1,
        userId: 1,
        conversationId: 7,
        joinedAt: new Date(),
      });

    const createdAt = new Date("2026-10-27T10:00:00.000Z");

    const messagesSpy = vi
      .spyOn(prisma.message, "findMany")
      .mockResolvedValueOnce([
        {
          id: 1,
          content: "Hello ChatSpace!",
          senderId: 1,
          conversationId: 7,
          createdAt,
          updatedAt: createdAt,
        },
      ]);

    const countSpy = vi.spyOn(prisma.message, "count").mockResolvedValueOnce(1);

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations/7/messages")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toHaveLength(1);
      expect(response.body.data.messages[0].content).toBe("Hello ChatSpace!");
      expect(response.body.data.messages[0].senderId).toBe(1);
      expect(response.body.data.messages[0].createdAt).toBe(
        createdAt.toISOString(),
      );
    } finally {
      membershipSpy.mockRestore();
      messagesSpy.mockRestore();
      countSpy.mockRestore();
    }
  });
});

describe("PATCH /conversations/7/messages/3", () => {
  it("should update own message and return HTTP 200", async () => {
    const membershipSpy = vi
      .spyOn(prisma.conversationParticipant, "findUnique")
      .mockResolvedValueOnce({
        id: 1,
        userId: 1,
        conversationId: 7,
        joinedAt: new Date(),
      });

    const createdAt = new Date("2026-10-27T10:00:00.000Z");

    const messagesSpy = vi
      .spyOn(prisma.message, "findFirst")
      .mockResolvedValueOnce({
        id: 3,
        content: "Original message",
        senderId: 1,
        conversationId: 7,
        createdAt,
        updatedAt: createdAt,
      });

    const updatedSpy = vi
      .spyOn(prisma.message, "update")
      .mockResolvedValueOnce({
        id: 3,
        content: "Updated message",
        senderId: 1,
        conversationId: 7,
        createdAt,
        updatedAt: new Date("2026-10-27T11:00:00.000Z"),
      });

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .patch("/conversations/7/messages/3")
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "Updated message" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe("Updated message");
      expect(messagesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 3,
            conversationId: 7,
            senderId: 1,
          },
        }),
      );

      expect(updatedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 3 },
          data: { content: "Updated message" },
        }),
      );
    } finally {
      membershipSpy.mockRestore();
      messagesSpy.mockRestore();
      updatedSpy.mockRestore();
    }
  });
});

describe("PATCH /conversations/7/messages/3 by non-author", () => {
  it("should return HTTP 404", async () => {
    const membershipSpy = vi
      .spyOn(prisma.conversationParticipant, "findUnique")
      .mockResolvedValueOnce({
        id: 1,
        userId: 1,
        conversationId: 7,
        joinedAt: new Date(),
      });

    const messageSpy = vi
      .spyOn(prisma.message, "findFirst")
      .mockResolvedValueOnce(null);

    const updateSpy = vi.spyOn(prisma.message, "update");

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .patch("/conversations/7/messages/3")
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "Updated message" });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Message not found");
      expect(updateSpy).not.toHaveBeenCalled();
    } finally {
      membershipSpy.mockRestore();
      messageSpy.mockRestore();
      updateSpy.mockRestore();
    }
  });
});

describe("PATCH /conversations/7/messages/3 with empty content", () => {
  it("should return HTTP 400", async () => {
    const token = signAccessToken(1);

    const response = await request(app)
      .patch("/conversations/7/messages/3")
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Validation failed");
  });
});

describe("DELETE /conversations/7/messages/3", () => {
  it("should delete own message and return HTTP 200", async () => {
    const membershipSpy = vi
      .spyOn(prisma.conversationParticipant, "findUnique")
      .mockResolvedValueOnce({
        id: 1,
        userId: 1,
        conversationId: 7,
        joinedAt: new Date(),
      });

    const createdAt = new Date("2026-10-27T10:00:00.000Z");

    const messageSpy = vi
      .spyOn(prisma.message, "findFirst")
      .mockResolvedValueOnce({
        id: 3,
        content: "Original message",
        senderId: 1,
        conversationId: 7,
        createdAt,
        updatedAt: createdAt,
      });

    const deleteSpy = vi.spyOn(prisma.message, "delete").mockResolvedValueOnce({
      id: 3,
      content: "Original message",
      senderId: 1,
      conversationId: 7,
      createdAt,
      updatedAt: new Date("2026-10-27T11:00:00.000Z"),
    });

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .delete("/conversations/7/messages/3")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Message deleted successfully");
      expect(response.body.data.id).toBe(3);
      expect(deleteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 3,
          },
        }),
      );
    } finally {
      membershipSpy.mockRestore();
      messageSpy.mockRestore();
      deleteSpy.mockRestore();
    }
  });
});

describe("DELETE /conversations/7/messages/3 by non-author", () => {
  it("should return HTTP 404", async () => {
    const membershipSpy = vi
      .spyOn(prisma.conversationParticipant, "findUnique")
      .mockResolvedValueOnce({
        id: 1,
        userId: 1,
        conversationId: 7,
        joinedAt: new Date(),
      });

    const messageSpy = vi
      .spyOn(prisma.message, "findFirst")
      .mockResolvedValueOnce(null);

    const deleteSpy = vi.spyOn(prisma.message, "delete");

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .delete("/conversations/7/messages/3")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Message not found");
      expect(deleteSpy).not.toHaveBeenCalled();
    } finally {
      membershipSpy.mockRestore();
      messageSpy.mockRestore();
      deleteSpy.mockRestore();
    }
  });
});

describe("DELETE /conversations/7/messages/invalid", () => {
  it("should return HTTP 400 for invalid message ID", async () => {
    const token = signAccessToken(1);

    const response = await request(app)
      .delete("/conversations/7/messages/invalid")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Invalid conversation or message ID");
  });
});

describe("GET /conversations authenticated user", () => {
  it("should return HTTP 200 with conversations", async () => {
    const conversationSpy = vi
      .spyOn(prisma.conversation, "findMany")
      .mockResolvedValueOnce([]);

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    } finally {
      conversationSpy.mockRestore();
    }
  });

  it("should return the latest message as lastMessage", async () => {
    const createdAt = new Date("2026-10-28T10:00:00.000Z");

    const lastMessage = {
      id: 3,
      content: "Hello ChatSpace!",
      senderId: 1,
      createdAt,
    };

    const conversation = {
      id: 7,
      createdAt,
      updatedAt: createdAt,

      privateUser1Id: 1,
      privateUser2Id: 2,

      participants: [],
      messages: [lastMessage],
    };

    const conversationSpy = vi
      .spyOn(prisma.conversation, "findMany")
      .mockResolvedValueOnce([conversation]);

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data[0].lastMessage.content).toEqual(
        "Hello ChatSpace!",
      );
    } finally {
      conversationSpy.mockRestore();
    }
  });

  it("should return null when conversation has no messages", async () => {
    const createdAt = new Date("2026-10-28T10:00:00.000Z");

    const conversation = {
      id: 7,
      createdAt,
      updatedAt: createdAt,
      privateUser1Id: 1,
      privateUser2Id: 2,
      participants: [],
      messages: [],
    };

    const conversationSpy = vi
      .spyOn(prisma.conversation, "findMany")
      .mockResolvedValueOnce([conversation]);

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data[0].lastMessage).toBeNull();
      expect(conversationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { updatedAt: "desc" },
        }),
      );
    } finally {
      conversationSpy.mockRestore();
    }
  });

  it("should return HTTP 401 without JWT", async () => {
    const response = await request(app).get("/conversations");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Authentication required");
  });

  it("returns unreadCount 0 when there are no unread messages", async () => {
    const createdAt = new Date("2026-10-28T10:00:00.000Z");

    const conversation = {
      id: 7,
      createdAt,
      updatedAt: createdAt,
      privateUser1Id: 1,
      privateUser2Id: 2,
      participants: [],
      messages: [],
    };

    const conversationSpy = vi
      .spyOn(prisma.conversation, "findMany")
      .mockResolvedValueOnce([conversation]);

    const queryRawSpy = vi.spyOn(prisma, "$queryRaw").mockResolvedValueOnce([]);

    try {
      const token = signAccessToken(1);
      const response = await request(app)
        .get("/conversations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Conversations fetched successfully");
      expect(response.body.data[0].unreadCount).toBe(0);
    } finally {
      conversationSpy.mockRestore();
      queryRawSpy.mockRestore();
    }
  });

  it("returns unreadCount for unread messages", async () => {
    const createdAt = new Date("2026-10-28T10:00:00.000Z");

    const conversation = {
      id: 7,
      createdAt,
      updatedAt: createdAt,
      privateUser1Id: 1,
      privateUser2Id: 2,
      participants: [],
      messages: [],
    };

    const conversationSpy = vi
      .spyOn(prisma.conversation, "findMany")
      .mockResolvedValueOnce([conversation]);

    const queryRawSpy = vi.spyOn(prisma, "$queryRaw").mockResolvedValueOnce([
      {
        conversationId: 7,
        unreadCount: 3n,
      },
    ]);

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data[0].unreadCount).toBe(3);
    } finally {
      conversationSpy.mockRestore();
      queryRawSpy.mockRestore();
    }
  });

  it("returns correct unreadCount for multiple conversations", async () => {
    const createdAt = new Date("2026-10-28T10:00:00.000Z");

    const conversation = {
      id: 7,
      createdAt,
      updatedAt: createdAt,
      privateUser1Id: 1,
      privateUser2Id: 2,
      participants: [],
      messages: [],
    };

    const unreadRaws = {
      id: 8,
      createdAt,
      updatedAt: createdAt,
      privateUser1Id: 1,
      privateUser2Id: 2,
      participants: [],
      messages: [],
    };

    const conversationSpy = vi
      .spyOn(prisma.conversation, "findMany")
      .mockResolvedValueOnce([conversation, unreadRaws]);

    const queryRawSpy = vi.spyOn(prisma, "$queryRaw").mockResolvedValueOnce([
      {
        conversationId: 7,
        unreadCount: 3n,
      },
      {
        conversationId: 8,
        unreadCount: 5n,
      },
    ]);

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data[0].unreadCount).toBe(3);
      expect(response.body.data[1].unreadCount).toBe(5);
    } finally {
      conversationSpy.mockRestore();
      queryRawSpy.mockRestore();
    }
  });

  it("returns zero unreadCount for conversations missing from SQL results", async () => {
    const createdAt = new Date("2026-10-28T10:00:00.000Z");

    const conversation = {
      id: 7,
      createdAt,
      updatedAt: createdAt,
      privateUser1Id: 1,
      privateUser2Id: 2,
      participants: [],
      messages: [],
    };

    const unreadRaws = {
      id: 8,
      createdAt,
      updatedAt: createdAt,
      privateUser1Id: 1,
      privateUser2Id: 2,
      participants: [],
      messages: [],
    };

    const conversationSpy = vi
      .spyOn(prisma.conversation, "findMany")
      .mockResolvedValueOnce([conversation, unreadRaws]);

    const queryRawSpy = vi.spyOn(prisma, "$queryRaw").mockResolvedValueOnce([
      {
        conversationId: 7,
        unreadCount: 3n,
      },
    ]);

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data[0].unreadCount).toBe(3);
      expect(response.body.data[1].unreadCount).toBe(0);
    } finally {
      conversationSpy.mockRestore();
      queryRawSpy.mockRestore();
    }
  });

  it("returns an empty list when user has no conversations", async () => {
    const conversationSpy = vi
      .spyOn(prisma.conversation, "findMany")
      .mockResolvedValueOnce([]);

    const queryRawSpy = vi.spyOn(prisma, "$queryRaw").mockResolvedValueOnce([]);

    try {
      const token = signAccessToken(1);

      const response = await request(app)
        .get("/conversations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Conversations fetched successfully");
      expect(response.body.data).toEqual([]);
    } finally {
      conversationSpy.mockRestore();
      queryRawSpy.mockRestore();
    }
  });
});
