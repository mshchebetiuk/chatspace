import { loadDrafts, saveDrafts } from "@/lib/draftStorage";

const EMPTY_DRAFTS: Record<string, string> = {};

let cachedDrafts: Record<string, string> = EMPTY_DRAFTS;
let isDraftLoaded: boolean = false;
const listeners = new Set<() => void>();

function notifyListeners(): void {
  listeners.forEach((listener) => {
    listener();
  });
}

export function getServerSnapshot(): Record<string, string> {
  return EMPTY_DRAFTS;
}

export function getSnapshot(): Record<string, string> {
  if (!isDraftLoaded) {
    cachedDrafts = loadDrafts();
    isDraftLoaded = true;
  }

  return cachedDrafts;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function updateDraft(conversationId: string, value: string): void {
  const currentDrafts = getSnapshot();

  cachedDrafts = {
    ...currentDrafts,
    [conversationId]: value,
  };

  saveDrafts(cachedDrafts);
  notifyListeners();
}
