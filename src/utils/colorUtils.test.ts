import { describe, it, expect } from "vitest";
import { hexToRgb, getLuminance, getContrastRatio } from "./colorUtils";

describe("colorUtils", () => {
  describe("hexToRgb", () => {
    it("converts valid hex codes to RGB", () => {
      expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    });

    it("handles invalid hex codes", () => {
      expect(hexToRgb("invalid")).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe("getLuminance", () => {
    it("calculates luminance correctly", () => {
      expect(getLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1);
      expect(getLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0);
    });
  });

  describe("getContrastRatio", () => {
    it("calculates contrast ratio", () => {
      expect(getContrastRatio(1, 0)).toBeCloseTo(21);
      expect(getContrastRatio(1, 1)).toBeCloseTo(1);
    });
  });
});
