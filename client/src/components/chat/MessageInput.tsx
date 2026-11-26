"use client";

import { useRef, useEffect, useLayoutEffect } from "react";

import { useMessageDrafts } from "@/hooks/useMessageDrafts";

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
  const { currentDraft, updateCurrentDraft } = useMessageDrafts(conversationId);

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
  }, [currentDraft]);

  const sendMessage = () => {
    if (conversationId === null || disabled) return;

    const trimmedDraft = currentDraft.trim();

    if (!trimmedDraft) {
      return;
    }

    onSendMessage(trimmedDraft);
    updateCurrentDraft("");
    textareaRef.current?.focus();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <form className="flex gap-2 p-4 border-t items-end" onSubmit={handleSubmit}>
      <textarea
        className="flex-1 border rounded-lg px-3 py-2 max-h-40 overflow-y-auto resize-none focus-visible:outline-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2"
        placeholder={placeholder}
        name="message"
        aria-label="Message"
        aria-describedby="message-counter"
        value={currentDraft}
        ref={textareaRef}
        onChange={(e) => updateCurrentDraft(e.target.value)}
        disabled={disabled}
        maxLength={500}
        rows={1}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) {
            return;
          }

          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        }}
      />
      <span
        id="message-counter"
        className={`text-xs pb-3 shrink-0 ${currentDraft.length < 450 ? "text-gray-500" : "text-red-500"}`}
      >
        {currentDraft.length} / 500
      </span>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={disabled || !currentDraft.trim()}
      >
        Send
      </button>
    </form>
  );
}
