"use client";

import { useState } from "react";

import ChatHeader from "@/components/chat/ChatHeader";

import type { Conversation } from "@/components/chat/ConversationList";
import { ConversationList } from "@/components/chat/ConversationList";

import type { Message } from "@/components/chat/MessageList";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";

export default function Home() {
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, Message[]>
  >({});
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  const activeMessages = activeConversationId
    ? (messagesByConversation[activeConversationId] ?? [])
    : [];

  const conversations: Conversation[] = [
    {
      id: "1",
      name: "Олександр Шевченко",
      lastMessage: "Привіт! Як справи з проєктом?",
    },
    {
      id: "2",
      name: "Марія Коваль",
      lastMessage: "Зустріч переноситься на завтра о 15:00.",
    },
    {
      id: "3",
      name: "Робоча група",
      lastMessage: "Нові макети вже в Figma.",
    },
  ];

  const handleSendMessage = (message: string) => {
    if (activeConversationId === null) {
      return;
    }

    const newMessage = {
      id: crypto.randomUUID(),
      sender: "Me",
      content: message,
      createdAt: new Date().toISOString(),
    };

    setMessagesByConversation((prev) => ({
      ...prev,
      [activeConversationId]: [
        ...(prev[activeConversationId] ?? []),
        newMessage,
      ],
    }));
  };

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
  };

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-4xl font-bold">ChatSpace</h1>
      <p>
        Active conversation ID:{" "}
        {activeConversationId ?? "No conversation selected"}
      </p>
      <p className="mt-4 text-gray-500">Connect and chat with your friends.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="md:col-span-1">
          <ChatHeader />
          <ConversationList
            conversations={conversations}
            onSelectConversation={handleSelectConversation}
            activeConversationId={activeConversationId}
          />
        </div>

        <div className="md:col-span-2">
          <MessageList messages={activeMessages} />
          <MessageInput
            placeholder="Type a message..."
            onSendMessage={handleSendMessage}
            disabled={activeConversationId === null}
          />
        </div>
      </div>
    </main>
  );
}
