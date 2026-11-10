import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../config/prisma.js";
import { getConversationMessages } from "./message.service.js";

vi.mock("../config/prisma.js", () => ({
  prisma: {
    message: {
      findMany: vi.fn(),
    },
  },
}));

describe("getConversationMessages", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should fetch the first page without cursor", async () => {
    vi.mocked(prisma.message.findMany).mockResolvedValue([]);
    const result = await getConversationMessages(10, 5);

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
    const result = await getConversationMessages(10, 5, 96);

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

    const result = await getConversationMessages(10, 2);

    expect(result).toEqual(messages);
  });

  it("should propagate Prisma errors", async () => {
    const error = new Error("Database unavailable");

    vi.mocked(prisma.message.findMany).mockRejectedValue(error);

    await expect(getConversationMessages(10, 5)).rejects.toThrow(
      "Database unavailable",
    );
  });

  it.each([0, -5, 101, 5.5, NaN])(
    "should reject invalid message limit: %s",
    async (limit) => {
      await expect(getConversationMessages(10, limit)).rejects.toThrow(
        "Invalid message limit",
      );
      expect(prisma.message.findMany).not.toHaveBeenCalled();
    },
  );
});
