import { describe, it, expect } from "vitest";
import { applyColorBlindnessFilter } from "./simulationUtils";

describe("simulationUtils", () => {
  it("applies color blindness filter", () => {
    applyColorBlindnessFilter("protanopia");
    expect(document.body.style.filter).toContain("url(#protanopia-filter)");
  });

  it("adds SVG filters to document", () => {
    applyColorBlindnessFilter("deuteranopia");
    const svg = document.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.innerHTML).toContain('filter id="deuteranopia-filter"');
  });
});
