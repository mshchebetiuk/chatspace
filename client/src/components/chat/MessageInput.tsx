"use client";

import { FormEvent, useState } from "react";

export type MessageInputProps = {
  placeholder: string;
  onSendMessage: (message: string) => void;
};

export function MessageInput({
  placeholder,
  onSendMessage,
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
      />

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Send
      </button>
    </form>
  );
}
