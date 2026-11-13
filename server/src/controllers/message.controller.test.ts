import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { getConversationMessagesController } from "./message.controller.js";
import { getConversationMessages } from "../services/message.service.js";

vi.mock("../services/message.service.js", () => ({
  getConversationMessages: vi.fn(),
}));

describe("getConversationMessagesController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    expect(getConversationMessages).not.toHaveBeenCalled();
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

  it("should return HTTP 400 when limit is zero", async () => {
    const req = {
      params: {
        id: "1",
      },
      query: {
        limit: "0",
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
    expect(getConversationMessages).not.toHaveBeenCalled();
  });

  it("should return HTTP 400 for negative cursor", async () => {
    const req = {
      params: {
        id: "1",
      },
      query: {
        cursor: "-1",
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
    expect(getConversationMessages).not.toHaveBeenCalled();
  });

  it("should return HTTP 400 when conversation ID is zero", async () => {
    const req = {
      params: {
        id: "0",
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
    expect(getConversationMessages).not.toHaveBeenCalled();
  });

  it("should return HTTP 400 when limit exceeds 100", async () => {
    const req = {
      params: {
        id: "1",
      },
      query: {
        limit: "101",
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
    expect(getConversationMessages).not.toHaveBeenCalled();
  });

  it("should return HTTP 200 with custom pagination", async () => {
    const req = {
      params: {
        id: "5",
      },
      query: {
        limit: "10",
        cursor: "25",
      },
    };

    const res = {
      status: vi.fn(),
      json: vi.fn(),
      locals: {
        userId: 1,
      },
    };

    vi.mocked(getConversationMessages).mockResolvedValue([]);
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
    expect(getConversationMessages).toHaveBeenCalledWith(5, 10, 25, 1);
  });
});
