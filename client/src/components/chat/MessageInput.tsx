"use client";

import { useState, useRef, useLayoutEffect } from "react";
import type { FormEvent } from "react";

export type MessageInputProps = {
  placeholder: string;
  onSendMessage: (message: string) => void;
  disabled: boolean;
};

export function MessageInput({
  placeholder,
  onSendMessage,
  disabled,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <form className="flex gap-2 p-4 border-t" onSubmit={handleSubmit}>
      <textarea
        className="flex-1 border rounded-lg px-3 py-2 max-h-40 overflow-y-auto"
        placeholder={placeholder}
        value={message}
        ref={textareaRef}
        onChange={(e) => setMessage(e.target.value)}
        disabled={disabled}
        maxLength={500}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        }}
      />
      <span
        className={`text-xs ${message.length < 450 ? "text-gray-500" : "text-red-500"}`}
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
