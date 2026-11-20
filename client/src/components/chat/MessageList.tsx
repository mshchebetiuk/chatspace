"use client";

import { useEffect, useRef } from "react";

export type Message = {
  id: string;
  sender: string;
  content: string;
  createdAt: string;
};

export type MessageListProps = {
  messages: Message[];
};

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <section className="w-full p-4">
        <h2 className="text-xl font-semibold mb-4">Messages</h2>
        <p className="text-xs text-gray-500 mt-2">No messages yet.</p>
      </section>
    );
  }

  return (
    <section className="w-full p-4">
      <h2 className="text-xl font-semibold mb-4">Messages</h2>
      <div className="space-y-3 h-64 overflow-y-auto md:h-96">
        {messages.map((message) => {
          const createdAt = new Date(message.createdAt);
          const today = new Date();

          const isToday: boolean =
            createdAt.getFullYear() === today.getFullYear() &&
            createdAt.getMonth() === today.getMonth() &&
            createdAt.getDate() === today.getDate();

          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);

          const isYesterday: boolean =
            createdAt.getFullYear() === yesterday.getFullYear() &&
            createdAt.getMonth() === yesterday.getMonth() &&
            createdAt.getDate() === yesterday.getDate();

          const dateLabel: string = isToday
            ? "Today"
            : isYesterday
              ? "Yesterday"
              : createdAt.toLocaleDateString("uk-UA");

          const isOwnMessage: boolean = message.sender === "Me";

          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              <article
                className={`max-w-[90%] md:max-w-[75%] rounded-lg p-3 ${isOwnMessage ? "bg-blue-100" : "bg-gray-100"}`}
              >
                <h3 className="font-semibold text-sm">{message.sender}</h3>
                <p className="text-sm mt-1">{message.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {dateLabel},{" "}
                  {createdAt.toLocaleTimeString("uk-UA", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </article>
            </div>
          );
        })}

        <div ref={bottomRef}></div>
      </div>
    </section>
  );
}
