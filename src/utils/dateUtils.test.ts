import { describe, it, expect } from "vitest";
import { formatDate } from "./dateUtils";

describe("dateUtils", () => {
  it("formats date correctly", () => {
    const testDate = new Date("2024-03-15T14:30:00");
    expect(formatDate(testDate)).toMatch(/March 15, 2024.*2:30/);
  });
});
