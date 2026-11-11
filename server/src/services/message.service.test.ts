import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../config/prisma.js";
import { getConversationMessages } from "./message.service.js";

vi.mock("../config/prisma.js", () => ({
  prisma: {
    message: {
      findMany: vi.fn(),
    },
    conversationParticipant: {
      findUnique: vi.fn(),
    },
  },
}));

describe("getConversationMessages", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma.conversationParticipant.findUnique).mockResolvedValue({
      id: 1,
      userId: 5,
      conversationId: 10,
      joinedAt: new Date("2026-01-01"),
    });
  });

  it("should fetch the first page without cursor", async () => {
    vi.mocked(prisma.message.findMany).mockResolvedValue([]);
    const result = await getConversationMessages(10, 5, undefined, 5);

    expect(prisma.message.findMany).toHaveBeenCalledWith({
      where: {
        conversationId: 10,
      },
      orderBy: {
        id: "desc",
      },
      take: 5,
    });

    expect(result).toEqual([]);
  });

  it("should fetch the next page with cursor", async () => {
    vi.mocked(prisma.message.findMany).mockResolvedValue([]);
    const result = await getConversationMessages(10, 5, 96, 5);

    expect(prisma.message.findMany).toHaveBeenCalledWith({
      where: {
        conversationId: 10,
      },
      orderBy: {
        id: "desc",
      },
      take: 5,
      cursor: { id: 96 },
      skip: 1,
    });
    expect(result).toEqual([]);
  });

  it("should return messages from Prisma", async () => {
    const messages = [
      {
        id: 100,
        content: "Hello!",
        senderId: 5,
        conversationId: 10,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      },
      {
        id: 99,
        content: "Hi!",
        senderId: 5,
        conversationId: 10,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      },
    ];

    vi.mocked(prisma.message.findMany).mockResolvedValue(messages);

    const result = await getConversationMessages(10, 2, undefined, 5);

    expect(result).toEqual(messages);
  });

  it("should propagate Prisma errors", async () => {
    const error = new Error("Database unavailable");

    vi.mocked(prisma.message.findMany).mockRejectedValue(error);

    await expect(getConversationMessages(10, 5, undefined, 5)).rejects.toThrow(
      "Database unavailable",
    );
  });

  it.each([0, -5, 101, 5.5, NaN])(
    "should reject invalid message limit: %s",
    async (limit) => {
      await expect(
        getConversationMessages(10, limit, undefined, 5),
      ).rejects.toThrow("Invalid message limit");
      expect(prisma.message.findMany).not.toHaveBeenCalled();
    },
  );

  it.each([0, -5, 2.5, NaN])(
    "should reject invalid conversation ID: %s",
    async (conversationId) => {
      await expect(
        getConversationMessages(conversationId, 10, undefined, 5),
      ).rejects.toThrow("Invalid conversation ID");
      expect(prisma.message.findMany).not.toHaveBeenCalled();
    },
  );

  it.each([0, -5, 2.5, NaN])(
    "should reject invalid cursor: %s",
    async (cursor) => {
      await expect(getConversationMessages(10, 5, cursor, 5)).rejects.toThrow(
        "Invalid message cursor",
      );
      expect(prisma.message.findMany).not.toHaveBeenCalled();
    },
  );

  it("should deny access when user is not a participant", async () => {
    vi.mocked(prisma.conversationParticipant.findUnique).mockResolvedValue(
      null,
    );

    await expect(getConversationMessages(10, 5, undefined, 5)).rejects.toThrow(
      "Access denied",
    );
    expect(prisma.message.findMany).not.toHaveBeenCalled();
    expect(prisma.conversationParticipant.findUnique).toHaveBeenCalledTimes(1);
  });

  it.each([0, -5, 2.5, NaN])(
    "should reject invalid userId: %s",
    async (userId) => {
      await expect(
        getConversationMessages(10, 5, undefined, userId),
      ).rejects.toThrow("Invalid user ID");
      expect(prisma.message.findMany).not.toHaveBeenCalled();
      expect(prisma.conversationParticipant.findUnique).not.toHaveBeenCalled();
    },
  );

  it("should check membership using correct userId and conversationId", async () => {
    await getConversationMessages(10, 5, undefined, 5);

    expect(prisma.conversationParticipant.findUnique).toHaveBeenCalledWith({
      where: {
        userId_conversationId: {
          userId: 5,
          conversationId: 10,
        },
      },
    });
  });

  it("should check membership before fetching messages", async () => {
    await getConversationMessages(10, 5, undefined, 5);

    const membershipOrder = vi.mocked(prisma.conversationParticipant.findUnique)
      .mock.invocationCallOrder[0];

    const messagesOrder = vi.mocked(prisma.message.findMany).mock
      .invocationCallOrder[0];

    if (membershipOrder === undefined || messagesOrder === undefined) {
      throw new Error("Expected both Prisma methods to be called");
    }

    expect(membershipOrder).toBeLessThan(messagesOrder);

    expect(prisma.conversationParticipant.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.message.findMany).toHaveBeenCalledTimes(1);
  });
});
