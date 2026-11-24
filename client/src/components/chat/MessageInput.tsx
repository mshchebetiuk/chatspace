"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import type { FormEvent } from "react";

export type MessageInputProps = {
  placeholder: string;
  onSendMessage: (message: string) => void;
  disabled: boolean;
  conversationId: string | null;
};

export function MessageInput({
  placeholder,
  onSendMessage,
  disabled,
  conversationId,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (disabled === false) {
      textareaRef.current?.focus();
    }
  }, [disabled, conversationId]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (textarea !== null) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [message]);

  const sendMessage = () => {
    if (!message.trim()) {
      return;
    }

    onSendMessage(message.trim());
    setMessage("");
    textareaRef.current?.focus();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <form className="flex gap-2 p-4 border-t items-end" onSubmit={handleSubmit}>
      <textarea
        className="flex-1 border rounded-lg px-3 py-2 max-h-40 overflow-y-auto resize-none"
        placeholder={placeholder}
        value={message}
        ref={textareaRef}
        onChange={(e) => setMessage(e.target.value)}
        disabled={disabled}
        maxLength={500}
        rows={1}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        }}
      />
      <span
        className={`text-xs pb-3 shrink-0 ${message.length < 450 ? "text-gray-500" : "text-red-500"}`}
      >
        {message.length} / 500
      </span>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={disabled || !message.trim()}
      >
        Send
      </button>
    </form>
  );
}
