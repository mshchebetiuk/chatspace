import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadDrafts, saveDrafts } from "./draftStorage";

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

describe("Draft storage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("localStorage", localStorageMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should load valid drafts from localStorage", () => {
    const drafts = {
      "1": "Hello Alex!",
      "2": "Hello Maria!",
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(drafts));

    const result = loadDrafts();

    expect(result).toEqual(drafts);
    expect(localStorageMock.getItem).toHaveBeenCalledWith(
      "chatspace:drafts:guest",
    );
    expect(localStorageMock.getItem).toHaveBeenCalledTimes(1);
  });

  it("should return empty drafts when storage key is missing", () => {
    localStorageMock.getItem.mockReturnValue(null);

    const result = loadDrafts();

    expect(result).toEqual({});
    expect(localStorageMock.getItem).toHaveBeenCalledWith(
      "chatspace:drafts:guest",
    );
    expect(localStorageMock.getItem).toHaveBeenCalledTimes(1);
  });

  it("should save valid drafts to localStorage", () => {
    const drafts = {
      "1": "Hello Alex!",
      "2": "Hello Maria!",
    };

    saveDrafts(drafts);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "chatspace:drafts:guest",
      JSON.stringify(drafts),
    );
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
  });

  it("should return empty drafts when JSON is invalid", () => {
    localStorageMock.getItem.mockReturnValue("invalid-json");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = loadDrafts();

    expect(result).toEqual({});
    expect(localStorageMock.getItem).toHaveBeenCalledWith(
      "chatspace:drafts:guest",
    );
    expect(localStorageMock.getItem).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to load drafts:",
      expect.any(SyntaxError),
    );
  });

  it("should return empty drafts when parsed JSON is null", () => {
    localStorageMock.getItem.mockReturnValue("null");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = loadDrafts();

    expect(result).toEqual({});
    expect(localStorageMock.getItem).toHaveBeenCalledWith(
      "chatspace:drafts:guest",
    );
    expect(localStorageMock.getItem).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("should return empty drafts when parsed JSON is an array", () => {
    const drafts = ["Hello Alex!", "Hello Maria!"];

    localStorageMock.getItem.mockReturnValue(JSON.stringify(drafts));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = loadDrafts();

    expect(result).toEqual({});
    expect(localStorageMock.getItem).toHaveBeenCalledWith(
      "chatspace:drafts:guest",
    );
    expect(localStorageMock.getItem).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("should return empty drafts when parsed JSON is a primitive", () => {
    const drafts = 42;

    localStorageMock.getItem.mockReturnValue(JSON.stringify(drafts));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = loadDrafts();

    expect(result).toEqual({});
    expect(localStorageMock.getItem).toHaveBeenCalledWith(
      "chatspace:drafts:guest",
    );
    expect(localStorageMock.getItem).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("should return empty drafts when draft values are invalid", () => {
    const drafts = {
      "1": "Hello Alex!",
      "2": 42,
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(drafts));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = loadDrafts();

    expect(result).toEqual({});
    expect(localStorageMock.getItem).toHaveBeenCalledWith(
      "chatspace:drafts:guest",
    );
    expect(localStorageMock.getItem).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("should return empty drafts when localStorage read fails", () => {
    const storageError = new Error("Storage access denied");
    localStorageMock.getItem.mockImplementation(() => {
      throw storageError;
    });

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = loadDrafts();

    expect(result).toEqual({});
    expect(localStorageMock.getItem).toHaveBeenCalledWith(
      "chatspace:drafts:guest",
    );
    expect(localStorageMock.getItem).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to load drafts:",
      storageError,
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it("should handle errors when localStorage write fails", () => {
    const drafts = {
      "1": "Hello Alex!",
      "2": "Hello Maria!",
    };

    const storageError = new Error("Storage quota exceeded");

    localStorageMock.setItem.mockImplementation(() => {
      throw storageError;
    });

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => saveDrafts(drafts)).not.toThrow();

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "chatspace:drafts:guest",
      JSON.stringify(drafts),
    );
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to save drafts:",
      storageError,
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
