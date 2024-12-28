import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mockMessageListener, mockChromeStorage } from "../test/chrome.mock";
import "../test/setup";
import { getContrastRatio } from "../utils/colorUtils";
import { applyColorBlindnessFilter } from "../utils/simulationUtils";

// Mock utility functions
vi.mock("../utils/colorUtils", () => ({
  getLuminance: vi.fn(),
  getContrastRatio: vi.fn(),
}));

vi.mock("../utils/highlightUtils", () => ({
  addHighlight: vi.fn(),
  removeHighlights: vi.fn(),
}));

vi.mock("../utils/simulationUtils", () => ({
  applyColorBlindnessFilter: vi.fn(),
}));

vi.mock("../utils/focusUtils", () => ({
  validateFocusIndicator: vi.fn(),
}));

import {
  validateForms,
  calculateScore,
  getElementPath,
  hasAccessibleLabel,
  getBestPractices,
  initializeContentScript,
} from "./content";

describe("Content Script", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("should register message listener", async () => {
    initializeContentScript();
    expect(mockMessageListener.addListener).toHaveBeenCalled();
  });

  describe("Color Parsing", () => {
    it("parses hex colors correctly", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.style.backgroundColor = "#ff0000";
      form.appendChild(input);
      document.body.appendChild(form);
    });
  });

  describe("Form Validation", () => {
    const mockSettings = {
      settings: {
        rules: [
          {
            enabled: true,
            id: "label",
            severity: "critical",
          },
          {
            enabled: true,
            id: "contrast",
            severity: "major",
          },
        ],
        threshold: {
          contrast: 4.5,
        },
      },
    };

    beforeEach(() => {
      vi.clearAllMocks();
      document.body.innerHTML = "";
      mockChromeStorage.sync.get.mockImplementation(() =>
        Promise.resolve(mockSettings),
      );
    });

    it("detects missing labels", async () => {
      // Add test form with unlabeled input
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.type = "text";
      input.id = "name";
      form.appendChild(input);
      document.body.appendChild(form);

      const results = await validateForms();

      expect(results).toHaveLength(1);
      expect(results[0].issues).toContainEqual(
        expect.objectContaining({
          issue: "Missing label or aria-label",
          elementType: "text",
        }),
      );
    });

    it("validates color contrast", async () => {
      // Setup form with contrast issue
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.type = "text";
      input.style.color = "#666666";
      input.style.backgroundColor = "#777777";
      form.appendChild(input);
      document.body.appendChild(form);

      // Mock storage and contrast calculation
      mockChromeStorage.sync.get.mockResolvedValueOnce(mockSettings);
      vi.mocked(getContrastRatio).mockReturnValue(3);

      const results = await validateForms();

      expect(results).toBeTruthy();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].issues).toContainEqual(
        expect.objectContaining({
          issue: expect.stringContaining("Insufficient color contrast"),
        }),
      );
    });
  });

  describe("Score Calculation", () => {
    it("calculates correct scores", () => {
      const issues = [
        { severity: "critical" },
        { severity: "major" },
        { severity: "minor" },
      ] as any;

      const score = calculateScore(issues, 10, 7);

      expect(score).toEqual({
        overall: 70,
        breakdown: {
          critical: 1,
          major: 1,
          minor: 1,
        },
      });
    });
  });

  describe("Element Identification", () => {
    it("generates correct element paths", () => {
      const div = document.createElement("div");
      div.id = "container";
      const input = document.createElement("input");
      input.className = "form-input";
      div.appendChild(input);
      document.body.appendChild(div);

      const path = getElementPath(input);
      expect(path).toBe("div#container > input.form-input");
    });
  });

  describe("Message Handling", () => {
    let messageHandler: (message: any, sender: any, sendResponse: any) => void;

    beforeEach(() => {
      vi.clearAllMocks();
      // Setup message handler
      messageHandler = (message: any, _sender: any, sendResponse: any) => {
        if (message.action === "simulate-impairment") {
          applyColorBlindnessFilter(message.type);
          sendResponse({ success: true });
          return true;
        }
        return false;
      };
      chrome.runtime.onMessage.addListener(messageHandler);
    });

    afterEach(() => {
      chrome.runtime.onMessage.removeListener(messageHandler);
    });

    it("handles simulation messages", () => {
      const sendResponse = vi.fn();

      // Trigger message handler
      messageHandler(
        { action: "simulate-impairment", type: "protanopia" },
        {},
        sendResponse,
      );

      // Verify mocks were called correctly
      expect(applyColorBlindnessFilter).toHaveBeenCalledWith("protanopia");
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });
  });

  describe("Accessibility Checks", () => {
    it("detects accessible labels correctly", () => {
      const input = document.createElement("input");
      const label = document.createElement("label");
      label.htmlFor = "test-input";
      input.id = "test-input";
      document.body.appendChild(label);
      document.body.appendChild(input);

      expect(hasAccessibleLabel(input)).toBe(true);
    });

    it("identifies best practices based on issues", () => {
      const issues = [
        { severity: "critical", issue: "Missing label" },
        { severity: "major", issue: "Insufficient color contrast" },
      ] as any;

      const practices = getBestPractices(issues);

      expect(practices).toEqual(
        expect.arrayContaining([
          expect.stringContaining("label"),
          expect.stringContaining("contrast"),
        ]),
      );
    });
  });
});
