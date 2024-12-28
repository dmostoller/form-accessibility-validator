import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadReport } from "./reportUtils";
import { ReportFormat } from "../types/reportTypes";

describe("reportUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock URL methods
    URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    URL.revokeObjectURL = vi.fn();

    // Mock Blob constructor
    global.Blob = vi.fn().mockImplementation((content, options) => ({
      content,
      options,
    }));

    // Mock document methods
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
  });

  it("generates JSON report", async () => {
    const results = [
      {
        formName: "Test Form",
        score: {
          overall: 100,
          breakdown: { critical: 0, major: 0, minor: 0 },
        },
        elements: { total: 1, passing: 1, withIssues: 0 },
        issues: [],
        bestPractices: [],
        passingElements: [],
      },
    ];

    await downloadReport(results, ReportFormat.JSON, "http://test.com");

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
  });
});
