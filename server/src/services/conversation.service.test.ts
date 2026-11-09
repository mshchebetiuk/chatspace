import { describe, it, expect, vi, beforeEach } from "vitest";
import { createConversation } from "./conversation.service.js";
import { prisma } from "../config/prisma.js";
import { Prisma } from "../generated/prisma/client.js";

vi.mock("../config/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    conversation: {
      create: vi.fn(),
      findUnique: vi.fn(),
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

  it("should normalize participant IDs in reverse order", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 5,
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

    vi.mocked(prisma.conversation.create).mockResolvedValueOnce(
      mockConversation,
    );

    const result = await createConversation(9, 5);

    expect(prisma.conversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          privateUser1Id: 5,
          privateUser2Id: 9,
        }),
      }),
    );

    expect(result).toEqual({
      status: "CREATED",
      conversation: mockConversation,
    });
  });

  it("should return EXISTING when conversation already exists", async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      {
        code: "P2002",
        clientVersion: "7.0.0",
      },
    );

    vi.mocked(prisma.conversation.create).mockRejectedValue(prismaError);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 9,
      name: "Test User",
      email: "test@example.com",
      passwordHash: "test-hash",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    });

    const existingConversation = {
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

    vi.mocked(prisma.conversation.findUnique).mockResolvedValue(
      existingConversation,
    );

    const result = await createConversation(5, 9);

    expect(result).toEqual({
      status: "EXISTING",
      conversation: existingConversation,
    });

    expect(prisma.conversation.findUnique).toHaveBeenCalledWith({
      where: {
        privateUser1Id_privateUser2Id: {
          privateUser1Id: 5,
          privateUser2Id: 9,
        },
      },
      include: {
        participants: true,
      },
    });
  });

  it("should rethrow unexpected Prisma errors", async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      "Record not found",
      {
        code: "P2025",
        clientVersion: "7.0.0",
      },
    );

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 9,
      name: "Test User",
      email: "test@example.com",
      passwordHash: "test-hash",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    });

    vi.mocked(prisma.conversation.create).mockRejectedValue(prismaError);

    await expect(createConversation(5, 9)).rejects.toThrow("Record not found");
    expect(prisma.conversation.findUnique).not.toHaveBeenCalled();
  });

  it("should rethrow P2002 when existing conversation is not found", async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      {
        code: "P2002",
        clientVersion: "7.0.0",
      },
    );

    vi.mocked(prisma.conversation.create).mockRejectedValue(prismaError);
    vi.mocked(prisma.conversation.findUnique).mockResolvedValue(null);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 9,
      name: "Test User",
      email: "test@example.com",
      passwordHash: "test-hash",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    });

    await expect(createConversation(5, 9)).rejects.toBe(prismaError);
    expect(prisma.conversation.findUnique).toHaveBeenCalledWith(5);
  });
});
