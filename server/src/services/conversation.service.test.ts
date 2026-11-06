import { describe, it, expect, vi, beforeEach } from "vitest";
import { createConversation } from "./conversation.service.js";
import { prisma } from "../config/prisma.js";

vi.mock("../config/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    conversation: {
      create: vi.fn(),
    },
  },
}));

describe("createConversation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should reject self-conversation", async () => {
    const result = await createConversation(5, 5);
    expect(result).toEqual({ status: "SELF_CONVERSATION" });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("should return PARTICIPANT_NOT_FOUND", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const result = await createConversation(5, 9999);

    expect(result).toEqual({ status: "PARTICIPANT_NOT_FOUND" });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: {
        id: 9999,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });

  it("should create a new conversation", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 9,
      name: "Test User",
      email: "test@example.com",
      passwordHash: "test-hash",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    });

    const mockConversation = {
      id: 100,
      privateUser1Id: 5,
      privateUser2Id: 9,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
      participants: [
        {
          userId: 5,
          joinedAt: new Date("2026-01-01"),
        },
        {
          userId: 9,
          joinedAt: new Date("2026-01-01"),
        },
      ],
    };

    vi.mocked(prisma.conversation.create).mockResolvedValue(mockConversation);

    const result = await createConversation(5, 9);

    expect(result).toEqual({
      status: "CREATED",
      conversation: mockConversation,
    });

    expect(prisma.conversation.create).toHaveBeenCalledWith({
      data: {
        privateUser1Id: 5,
        privateUser2Id: 9,
        participants: {
          create: [{ userId: 5 }, { userId: 9 }],
        },
      },
      include: {
        participants: true,
      },
    });

    expect(prisma.conversation.create).toHaveBeenCalledTimes(1);
  });
});
