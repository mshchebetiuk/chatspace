const DRAFT_STORAGE_KEY = "chatspace:drafts:guest";

export function loadDrafts(): Record<string, string> {
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

export function saveDrafts(drafts: Record<string, string>): void {
  try {
    const serializedDrafts = JSON.stringify(drafts);
    localStorage.setItem(DRAFT_STORAGE_KEY, serializedDrafts);
  } catch (error: unknown) {
    console.error("Failed to save drafts:", error);
  }
}
