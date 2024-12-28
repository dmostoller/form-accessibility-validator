import { ValidationResult } from "../types/reportTypes";
import { formatDate } from "./dateUtils";

const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const generateHtmlReport = (
  results: ValidationResult[],
  pageUrl: string,
): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Form Accessibility Report</title>
               <style>
          :root {
            --color-critical: #dc2626;
            --color-major: #d97706;
            --color-minor: #2563eb;
            --color-success: #16a34a;
          }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 1rem;
            line-height: 1.4;
            color: #1f2937;
          }
          h1, h2, h3, h4, h5 { 
            margin-top: 1em;
            margin-bottom: 0.3em;
            color: #111827;
          }
          h1 { font-size: 1.75rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.3rem; }
          h2 { font-size: 1.5rem; }
          h3 { font-size: 1.25rem; }
          h4 { font-size: 1.1rem; }
          
          .meta-info {
            color: #6b7280;
            font-size: 0.875rem;
            margin: 0.5rem 0;
          }
          
          .score-card {
            background: #f8fafc;
            border-radius: 6px;
            padding: 1rem;
            margin: 0.5rem 0;
            border: 1px solid #e5e7eb;
          }
          
          .score {
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--color-success);
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 0.5rem;
            margin: 0.5rem 0;
          }
          
          .stat-box {
            background: white;
            padding: 0.75rem;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
          }
          
          .issue-list {
            display: grid;
            gap: 0.5rem;
          }
          
          .issue-card {
            background: white;
            border-radius: 4px;
            padding: 0.75rem;
            border: 1px solid #e5e7eb;
          }
          
          .issue-card.critical { border-left: 3px solid var(--color-critical); }
          .issue-card.major { border-left: 3px solid var(--color-major); }
          .issue-card.minor { border-left: 3px solid var(--color-minor); }
          
          .severity-badge {
            display: inline-block;
            padding: 0.15rem 0.5rem;
            border-radius: 999px;
            font-size: 0.7rem;
            font-weight: 500;
            text-transform: uppercase;
          }
          
          .severity-badge.critical { background: #fef2f2; color: var(--color-critical); }
          .severity-badge.major { background: #fffbeb; color: var(--color-major); }
          .severity-badge.minor { background: #eff6ff; color: var(--color-minor); }
          
          .code-container {
            margin: 0.5rem 0;
            border-radius: 4px;
            background: #f5f5f5; 
          }

          .code-example {
            margin: 0;
            padding: 0.75rem;
            background: #f5f5f5;  
            color: #1a1a1a;     
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
            font-size: 0.7rem;
            line-height: 1.3;
            overflow-x: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
            tab-size: 4;
          }
          
          .best-practices {
            list-style: none;
            padding-left: 0;
            margin: 0.5rem 0;
          }
          
          .best-practices li {
            padding: 0.25rem 0;
            padding-left: 1.25rem;
            position: relative;
          }
          
          .best-practices li::before {
            content: "✓";
            color: var(--color-success);
            position: absolute;
            left: 0;
          }

          dl {
            margin: 0.5rem 0;
          }
          dt {
            font-weight: bold;
            margin-top: 0.25rem;
          }
          dd {
            margin-left: 0;
            margin-bottom: 0.25rem;
          }
        </style>
      </head>
      <body>
        <h1>Form Accessibility Report</h1>
        <p class="meta-info">Generated: ${formatDate(new Date())}</p>
        <p class="meta-info">Page URL: ${escapeHtml(pageUrl)}</p>
        <section class="summary">
          <h2>Summary</h2>
          <p>Total Forms Analyzed: ${results.length}</p>
        </section>

        ${results
          .map(
            (result) => `
          <section class="form-section">
            <h3>${result.formName}</h3>
            
            <div class="score-card">
              <div class="score">${result.score.overall}%</div>
              <div class="stats-grid">
                <div class="stat-box">
                  <h4>Elements</h4>
                  <p>Total: ${result.elements.total}</p>
                  <p>Passing: ${result.elements.passing}</p>
                  <p>With Issues: ${result.elements.withIssues}</p>
                </div>
                <div class="stat-box">
                  <h4>Issues by Severity</h4>
                  <p class="critical">Critical: ${result.score.breakdown.critical}</p>
                  <p class="major">Major: ${result.score.breakdown.major}</p>
                  <p class="minor">Minor: ${result.score.breakdown.minor}</p>
                </div>
              </div>
            </div>

            <h4>Best Practices</h4>
            <ul class="best-practices">
              ${result.bestPractices.map((practice) => `<li>${practice}</li>`).join("")}
            </ul>

            <h4>Issues Found</h4>
            <div class="issue-list">
              ${result.issues
                .map(
                  (issue) => `
                <div class="issue-card ${issue.severity}">
                  <span class="severity-badge ${issue.severity}">${issue.severity}</span>
                  <h5>${issue.issue}</h5>
                  <dl>
                    <dt>Element:</dt>
                    <dd>${issue.element}</dd>
                    <dt>WCAG:</dt>
                    <dd>${issue.wcag}</dd>
                    <dt>Impact:</dt>
                    <dd>${issue.impact}</dd>
                    <dt>Advice:</dt>
                    <dd>${issue.advice}</dd>
                  </dl>
                    ${
                      issue.codeExample
                        ? `<div class="code-container">
                                <pre class="code-example"><code>${escapeHtml(issue.codeExample)}</code></pre>
                            </div>`
                        : ""
                    }
                </div>
              `,
                )
                .join("")}
            </div>
          </section>
        `,
          )
          .join("")}
      </body>
    </html>
  `;
};
