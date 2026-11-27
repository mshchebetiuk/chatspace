// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

describe("MessageInput", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("should initialize jsdom environment", () => {
    expect(document.body).toBeInTheDocument();
    expect(localStorage.length).toBe(0);
    expect(typeof window).toBe("object");
  });

  it("should render message input with initial state", async () => {
    const importedModule = await import("./MessageInput");
    const MessageInput = importedModule.MessageInput;

    console.log("Module exports:", Object.keys(module));
    console.log("MessageInput type:", typeof MessageInput);

    const onSendMessage = vi.fn();

    render(
      <MessageInput
        placeholder="Type a message..."
        onSendMessage={onSendMessage}
        disabled={false}
        conversationId="1"
      />,
    );

    const textarea = screen.getByRole("textbox", { name: /message/i });
    const sendButton = screen.getByRole("button", { name: /send/i });
    const counter = screen.getByText("0 / 500");

    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute("placeholder", "Type a message...");
    expect(textarea).toHaveValue("");
    expect(textarea).toBeEnabled();

    expect(sendButton).toBeInTheDocument();
    expect(sendButton).toBeDisabled();

    expect(counter).toBeInTheDocument();
    expect(onSendMessage).not.toHaveBeenCalled();
  });
});
