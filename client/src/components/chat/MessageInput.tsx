"use client";

import {
  useRef,
  useEffect,
  useLayoutEffect,
  useSyncExternalStore,
} from "react";
import type { FormEvent } from "react";

const DRAFT_STORAGE_KEY = "chatspace:drafts:guest";
const EMPTY_DRAFTS: Record<string, string> = {};

let cachedDrafts: Record<string, string> = EMPTY_DRAFTS;
let isDraftLoaded: boolean = false;
const listeners = new Set<() => void>();

function getServerSnapshot(): Record<string, string> {
  return EMPTY_DRAFTS;
}

function loadDrafts(): Record<string, string> {
  try {
    const savedDrafts = localStorage.getItem(DRAFT_STORAGE_KEY);

    if (savedDrafts === null) return {};

    const parsedDrafts: unknown = JSON.parse(savedDrafts);

    if (
      typeof parsedDrafts !== "object" ||
      parsedDrafts === null ||
      Array.isArray(parsedDrafts)
    ) {
      return {};
    }

    const isValidDrafts = Object.values(parsedDrafts).every(
      (value) => typeof value === "string",
    );

    if (!isValidDrafts) return {};

    return parsedDrafts as Record<string, string>;
  } catch (error: unknown) {
    console.error("Failed to load drafts:", error);
    return {};
  }
}

function saveDrafts(drafts: Record<string, string>): void {
  try {
    const serializedDrafts = JSON.stringify(drafts);
    localStorage.setItem(DRAFT_STORAGE_KEY, serializedDrafts);
  } catch (error: unknown) {
    console.error("Failed to save drafts:", error);
  }
}

function getSnapshot(): Record<string, string> {
  if (!isDraftLoaded) {
    cachedDrafts = loadDrafts();
    isDraftLoaded = true;
  }

  return cachedDrafts;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(): void {
  listeners.forEach((listener) => {
    listener();
  });
}

function updateDraft(conversationId: string, value: string): void {
  const currentDrafts = getSnapshot();

  cachedDrafts = {
    ...currentDrafts,
    [conversationId]: value,
  };

  saveDrafts(cachedDrafts);
  notifyListeners();
}

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
  const drafts = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentDraft =
    conversationId !== null ? (drafts[conversationId] ?? "") : "";

  const updateCurrentDraft = (value: string) => {
    if (conversationId === null) return;
    updateDraft(conversationId, value);
  };

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
