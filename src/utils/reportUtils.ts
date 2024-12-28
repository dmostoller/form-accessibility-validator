import html2pdf from "html2pdf.js";
import { ValidationResult, ReportFormat } from "../types/reportTypes";
import { formatDate } from "./dateUtils";
import { generateHtmlReport } from "./generateHTMLReport";

const generateMarkdownReport = (
  results: ValidationResult[],
  pageUrl: string,
): string => {
  let markdown = "# Accessibility Validation Report\n\n";
  markdown += `Generated on: ${formatDate(new Date())}\n\n`;
  markdown += `Page URL: ${pageUrl}\n\n`;

  results.forEach((result) => {
    markdown += `## Form: ${result.formName}\n`;

    markdown += `### Summary\n`;
    markdown += `- Overall Score: ${result.score.overall}%\n`;
    markdown += `- Total Elements: ${result.elements.total}\n`;
    markdown += `- Passing Elements: ${result.elements.passing}\n`;
    markdown += `- Elements with Issues: ${result.elements.withIssues}\n\n`;

    if (result.passingElements && result.passingElements.length > 0) {
      markdown += `### Passing Elements\n`;
      result.passingElements.forEach((element) => {
        markdown += `- ${element.element} (${element.elementType})\n`;
        if (element.attributes) {
          markdown += `  - Attributes: ${Object.entries(element.attributes)
            .map(([key, value]) => `${key}="${value}"`)
            .join(", ")}\n`;
        }
      });
      markdown += "\n";
    }

    if (result.bestPractices.length > 0) {
      markdown += `### Best Practices\n`;
      result.bestPractices.forEach((practice) => {
        markdown += `- ${practice}\n`;
      });
      markdown += "\n";
    }

    if (result.issues.length > 0) {
      markdown += `### Issues\n`;
      result.issues.forEach((issue) => {
        markdown += `#### ${issue.severity} Issue\n`;
        markdown += `- Element: ${issue.element}\n`;
        markdown += `- Type: ${issue.elementType}\n`;
        markdown += `- WCAG: ${issue.wcag}\n`;
        markdown += `- Impact: ${issue.impact}\n`;
        markdown += `- Issue: ${issue.issue}\n`;
        markdown += `- Advice: ${issue.advice}\n`;
        markdown += `- Path: ${issue.elementPath}\n`;
        if (issue.codeExample) {
          markdown += `\`\`\`html\n${issue.codeExample}\n\`\`\`\n`;
        }
        markdown += "\n";
      });
    }
  });

  return markdown;
};

const generateJsonReport = (
  results: ValidationResult[],
  pageUrl: string,
): string => {
  return JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      pageUrl: pageUrl,
      results: results,
    },
    null,
    2,
  );
};

export const downloadReport = async (
  results: ValidationResult[],
  format: ReportFormat,
  pageUrl: string,
): Promise<void> => {
  const timestamp = new Date().toISOString().split("T")[0];

  if (format === ReportFormat.JSON) {
    const jsonReport = generateJsonReport(results, pageUrl);
    const blob = new Blob([jsonReport], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `accessibility-report-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else if (format === ReportFormat.MARKDOWN) {
    const markdownReport = generateMarkdownReport(results, pageUrl);
    const blob = new Blob([markdownReport], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `accessibility-report-${timestamp}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    const htmlReport = generateHtmlReport(results, pageUrl);
    const element = document.createElement("div");
    element.innerHTML = htmlReport;
    document.body.appendChild(element);

    try {
      await html2pdf()
        .set({
          margin: 10,
          filename: `accessibility-report-${timestamp}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(element)
        .save();
    } finally {
      document.body.removeChild(element);
    }
  }
};
