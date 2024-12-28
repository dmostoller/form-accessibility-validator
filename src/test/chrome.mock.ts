import { vi } from "vitest";

export const mockMessageListener = {
  addListener: vi.fn(),
  removeListener: vi.fn(),
  hasListeners: vi.fn(),
};

export const mockChromeStorage = {
  sync: {
    get: vi.fn(),
    set: vi.fn(),
  },
};

export const chromeMock = {
  tabs: {
    query: vi.fn().mockResolvedValue([{ id: 1 }]),
    sendMessage: vi.fn().mockResolvedValue({ success: true }),
  },
  runtime: {
    lastError: null,
    onMessage: mockMessageListener,
  },
  storage: mockChromeStorage,
};

vi.stubGlobal("chrome", chromeMock);
