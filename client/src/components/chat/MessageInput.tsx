"use client";

import { useState } from "react";
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!message.trim()) return;

    onSendMessage(message.trim());
    setMessage("");
  };

  return (
    <form className="flex gap-2 p-4 border-t" onSubmit={handleSubmit}>
      <input
        type="text"
        className="flex-1 border rounded-lg px-3 py-2"
        placeholder={placeholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={disabled}
        maxLength={500}
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
