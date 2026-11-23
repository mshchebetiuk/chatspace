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

const formatMessageTime = (date: Date): string => {
  return date.toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMessageDate = (date: Date): string => {
  const today = new Date();

  const isToday: boolean =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (isToday === true) return "Today";

  const yesterday = new Date(today.getTime());
  yesterday.setDate(today.getDate() - 1);

  const isYesterday: boolean =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday === true) return "Yesterday";

  return date.toLocaleDateString("uk-UA");
};

export function MessageList({ messages }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef<boolean>(true);

  const handleScroll = (): void => {
    shouldAutoScrollRef.current = isNearBottom();
  };

  const isNearBottom = (): boolean => {
    const container = containerRef.current;

    if (!container) return false;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    return distanceFromBottom <= 50;
  };

  useEffect(() => {
    if (!shouldAutoScrollRef.current) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
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
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="space-y-3 h-64 overflow-y-auto md:h-96"
      >
        {messages.map((message) => {
          const createdAt = new Date(message.createdAt);
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
                  {formatMessageDate(createdAt)}, {formatMessageTime(createdAt)}
                </p>
              </article>
            </div>
          );
        })}
      </div>
    </section>
  );
}
