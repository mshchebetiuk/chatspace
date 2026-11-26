import { useSyncExternalStore } from "react";
import {
  getSnapshot,
  getServerSnapshot,
  subscribe,
  updateDraft,
} from "@/stores/messageDraftStore";

type UseMessageDraftsReturn = {
  currentDraft: string;
  updateCurrentDraft: (draft: string) => void;
};

export function useMessageDrafts(
  conversationId: string | null,
): UseMessageDraftsReturn {
  const drafts = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const currentDraft =
    conversationId && drafts[conversationId] ? drafts[conversationId] : "";

  const updateCurrentDraft = (draft: string): void => {
    if (conversationId === null) return;
    updateDraft(conversationId, draft);
  };

  return {
    currentDraft,
    updateCurrentDraft,
  };
}
