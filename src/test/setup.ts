import "@testing-library/jest-dom";
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import "./chrome.mock";

// Extend expect with jest-dom matchers
expect.extend(matchers);

// Mock window methods commonly used in tests
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
