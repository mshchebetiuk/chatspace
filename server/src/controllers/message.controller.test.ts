import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import { getConversationMessagesController } from "./message.controller.js";
import { getConversationMessages } from "../services/message.service.js";

vi.mock("../services/message.service.js", () => ({
  getConversationMessages: vi.fn(),
}));

describe("getConversationMessageController", () => {
  it("should return HTTP 400 for invalid conversation ID", async () => {
    const req = {
      params: {
        id: "abc",
      },
      query: {},
    };

    const res = {
      status: vi.fn(),
      json: vi.fn(),
      locals: {
        userId: 1,
      },
    };

    res.status.mockReturnValue(res);

    await getConversationMessagesController(
      req as unknown as Request,
      res as unknown as Response,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Invalid conversation ID",
    });
  });

  it("should return HTTP 400 for invalid cursor", async () => {
    const req = {
      params: {
        id: "1",
      },
      query: {
        cursor: "abc",
      },
    };

    const res = {
      status: vi.fn(),
      json: vi.fn(),
      locals: {
        userId: 1,
      },
    };

    res.status.mockReturnValue(res);

    await getConversationMessagesController(
      req as unknown as Request,
      res as unknown as Response,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Invalid cursor",
    });
  });

  it("should return HTTP 401 when authentication is required", async () => {
    const req = {
      params: {
        id: "1",
      },
      query: {},
    };

    const res = {
      status: vi.fn(),
      json: vi.fn(),
      locals: {
        userId: 0,
      },
    };

    res.status.mockReturnValue(res);

    await getConversationMessagesController(
      req as unknown as Request,
      res as unknown as Response,
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Authentication required",
    });
  });

  it("should return HTTP 400 for invalid pagination limit", async () => {
    const req = {
      params: {
        id: "1",
      },
      query: {
        limit: "150",
      },
    };

    const res = {
      status: vi.fn(),
      json: vi.fn(),
      locals: {
        userId: 1,
      },
    };

    res.status.mockReturnValue(res);

    await getConversationMessagesController(
      req as unknown as Request,
      res as unknown as Response,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Invalid pagination parameters",
    });
  });

  it("should return HTTP 200 with messages", async () => {
    vi.mocked(getConversationMessages).mockResolvedValue([]);

    const req = {
      params: {
        id: "1",
      },
      query: {},
    };

    const res = {
      status: vi.fn(),
      json: vi.fn(),
      locals: {
        userId: 1,
      },
    };

    res.status.mockReturnValue(res);

    await getConversationMessagesController(
      req as unknown as Request,
      res as unknown as Response,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [],
    });
    expect(getConversationMessages).toHaveBeenCalledWith(1, 20, undefined, 1);
  });
});
