import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadSettings, saveSettings, defaultSettings } from "./settingsStorage";

// Create a mock storage object
const mockStorage = {
  sync: {
    get: vi.fn(),
    set: vi.fn(),
  },
};

// Mock the chrome object with storage
vi.stubGlobal("chrome", {
  storage: mockStorage,
});

describe("settingsStorage", () => {
  beforeEach(() => {
    // Clear mock calls between tests
    vi.clearAllMocks();
  });

  it("loads default settings when storage is empty", async () => {
    // Setup mock to return undefined settings
    mockStorage.sync.get.mockResolvedValue({ settings: undefined });

    const settings = await loadSettings();
    expect(settings).toEqual(defaultSettings);
    expect(mockStorage.sync.get).toHaveBeenCalledWith("settings");
  });

  it("loads saved settings from storage", async () => {
    // Setup mock to return custom settings
    const savedSettings = {
      ...defaultSettings,
      display: { ...defaultSettings.display, showPassingElements: false },
    };
    mockStorage.sync.get.mockResolvedValue({ settings: savedSettings });

    const settings = await loadSettings();
    expect(settings).toEqual(savedSettings);
    expect(mockStorage.sync.get).toHaveBeenCalledWith("settings");
  });

  it("saves settings to storage", async () => {
    mockStorage.sync.set.mockResolvedValue(undefined);

    await saveSettings(defaultSettings);
    expect(mockStorage.sync.set).toHaveBeenCalledWith({
      settings: defaultSettings,
    });
  });

  it("handles storage errors gracefully", async () => {
    mockStorage.sync.get.mockRejectedValue(new Error("Storage error"));

    await expect(loadSettings()).resolves.toEqual(defaultSettings);
  });
});
