import { describe, it, expect, afterEach } from "vitest";
import { addHighlight, removeHighlights } from "./highlightUtils";

describe("highlightUtils", () => {
  afterEach(() => {
    removeHighlights();
  });

  it("adds highlight to element", () => {
    const element = document.createElement("div");
    document.body.appendChild(element);

    addHighlight(element, {
      color: "#ff0000",
      label: "Test",
      severity: "critical",
    });

    const highlight = document.querySelector(".a11y-highlight");
    expect(highlight).toBeTruthy();
    expect(highlight?.querySelector(".a11y-highlight-label")?.textContent).toBe(
      "Test",
    );
  });

  it("removes all highlights", () => {
    const element = document.createElement("div");
    document.body.appendChild(element);

    addHighlight(element, {
      color: "#ff0000",
      label: "Test",
      severity: "critical",
    });

    removeHighlights();
    expect(document.querySelector(".a11y-highlight")).toBeNull();
  });
});
