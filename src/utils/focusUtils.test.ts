import { describe, it, expect } from "vitest";
import { validateFocusIndicator } from "./focusUtils";

describe("focusUtils", () => {
  it("validates focus indicators", async () => {
    const element = document.createElement("button");
    document.body.appendChild(element);

    try {
      const result = await validateFocusIndicator(element);
      expect(typeof result).toBe("boolean");
    } finally {
      document.body.removeChild(element);
    }
  });
});
