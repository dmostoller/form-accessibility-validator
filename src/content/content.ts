import { getLuminance, getContrastRatio } from "../utils/colorUtils";
import { addHighlight, removeHighlights } from "../utils/highlightUtils";
import { applyColorBlindnessFilter } from "../utils/simulationUtils";
import { validateFocusIndicator } from "../utils/focusUtils";

import {
  ValidationResult,
  AccessibilityIssue,
  RGB,
  FormGroupValidation,
} from "../types/validationTypes";
import { ValidationRule, Settings } from "../types/settingsTypes";

export const defaultRules: ValidationRule[] = [
  {
    id: "label",
    name: "Form Control Labels",
    description: "Every form control must have an associated label",
    enabled: true,
    severity: "critical",
    wcag: "1.3.1",
    examples: [
      '<label for="name">Name:</label>\n<input id="name" type="text">',
      '<input aria-label="Search" type="search">',
    ],
  },
  {
    id: "contrast",
    name: "Color Contrast",
    description: "Text must have sufficient contrast with its background",
    enabled: true,
    severity: "major",
    wcag: "1.4.3",
  },
  {
    id: "focus",
    name: "Focus Indicators",
    description: "Interactive elements must have visible focus indicators",
    enabled: true,
    severity: "critical",
    wcag: "2.4.7",
  },
  {
    id: "fieldset",
    name: "Form Field Groups",
    description:
      "Related form controls should be grouped with fieldset and legend",
    enabled: true,
    severity: "major",
    wcag: "1.3.1",
    examples: [
      "<fieldset>\n  <legend>Contact Details</legend>\n  <!-- form controls -->\n</fieldset>",
    ],
  },
  {
    id: "autocomplete",
    name: "Autocomplete Attributes",
    description: "Use autocomplete attributes for common input types",
    enabled: true,
    severity: "minor",
    wcag: "1.3.5",
    examples: [
      '<input type="email" autocomplete="email">',
      '<input type="tel" autocomplete="tel">',
    ],
  },
  {
    id: "errorList",
    name: "Error Message Lists",
    description: "Form errors should be displayed in a list above the form",
    enabled: true,
    severity: "critical",
    wcag: "3.3.1",
    examples: [
      '<div role="alert">\n  <ul>\n    <li>Please correct the following:</li>\n  </ul>\n</div>',
    ],
  },
  {
    id: "errorAssociation",
    name: "Error Message Association",
    description: "Error messages must be associated with their form controls",
    enabled: true,
    severity: "critical",
    wcag: "3.3.1",
    examples: [
      '<input aria-invalid="true" aria-describedby="error-1">\n<div id="error-1">Please enter a valid email</div>',
    ],
  },
];

export const defaultSettings: Settings = {
  rules: defaultRules,
  contrast: {
    minimumRatio: 4.5,
    largeTextRatio: 3,
  },
  display: {
    showPassingElements: true,
    showElementPaths: true,
    showCodeExamples: true,
    severityFilter: "all",
  },
  errorStates: {
    requireErrorSummary: true,
    requireAriaInvalid: true,
    requireAriaDescribedby: true,
  },
};

const loadSettings = async () => {
  const stored = await chrome.storage.sync.get("settings");
  return stored.settings || defaultSettings;
};

const parseColor = (color: string): RGB => {
  // Handle named colors using a temporary div
  if (!/^(#|rgb|rgba)/.test(color)) {
    const div = document.createElement("div");
    div.style.color = color;
    document.body.appendChild(div);
    const computed = getComputedStyle(div).color;
    document.body.removeChild(div);
    color = computed;
  }

  // Handle rgb/rgba format
  if (color.startsWith("rgb")) {
    const [r, g, b] = color.match(/\d+/g)!.map(Number).slice(0, 3);
    return { r, g, b };
  }

  // Handle hex format
  if (color.startsWith("#")) {
    color = color.replace("#", "");
    if (color.length === 3) {
      color = color
        .split("")
        .map((c) => c + c)
        .join("");
    }
    return {
      r: parseInt(color.substr(0, 2), 16),
      g: parseInt(color.substr(2, 2), 16),
      b: parseInt(color.substr(4, 2), 16),
    };
  }

  // Default to black if parsing fails
  return { r: 0, g: 0, b: 0 };
};

export const calculateScore = (
  issues: AccessibilityIssue[],
  totalElements: number,
  passingElements: number,
): {
  overall: number;
  breakdown: { critical: number; major: number; minor: number };
} => {
  const breakdown = {
    critical: issues.filter((i) => i.severity === "critical").length,
    major: issues.filter((i) => i.severity === "major").length,
    minor: issues.filter((i) => i.severity === "minor").length,
  };

  // Calculate score based on passing elements percentage
  const score = Math.round((passingElements / totalElements) * 100);

  return {
    overall: Math.max(0, Math.min(100, score)),
    breakdown,
  };
};

const getElementIdentifier = (element: HTMLElement): string => {
  if (element.id) {
    return `#${element.id}`;
  } else if (element.getAttribute("name")) {
    return `[name="${element.getAttribute("name")}"]`;
  }
  return `${element.tagName.toLowerCase()}:nth-child(${Array.from(element.parentElement?.children || []).indexOf(element) + 1})`;
};

export const getElementPath = (element: HTMLElement): string => {
  const path: string[] = [];
  let currentElement: HTMLElement | null = element;

  while (currentElement && currentElement !== document.body) {
    let selector = currentElement.tagName.toLowerCase();
    if (currentElement.id) {
      selector += `#${currentElement.id}`;
    } else if (currentElement.className) {
      selector += `.${currentElement.className.split(" ").join(".")}`;
    }
    path.unshift(selector);
    currentElement = currentElement.parentElement;
  }

  return path.join(" > ");
};

type IssueKey =
  | "Missing label or aria-label"
  | "Insufficient color contrast"
  | "Missing focus indicator";

const getAdvice = (
  issue: string,
  details?: { contrast?: number },
): {
  advice: string;
  severity: "critical" | "major" | "minor";
  wcag: string;
  impact: string;
  codeExample: string;
} => {
  const issues: Record<
    IssueKey,
    {
      advice: string;
      severity: "critical" | "major" | "minor";
      wcag: string;
      impact: string;
      codeExample: string;
    }
  > = {
    "Missing label or aria-label": {
      advice:
        "Add a `<label>` element or `aria-label` attribute to make the form control accessible to screen readers.",
      severity: "critical",
      wcag: "WCAG 2.1 Success Criterion 1.3.1 Info and Relationships (Level A)",
      impact:
        "Screen reader users cannot identify the purpose of this form control",
      codeExample: `<!-- Using label element -->
<label for="email">Email address</label>
<input type="email" id="email" />

<!-- Using aria-label -->
<input type="email" aria-label="Email address" />`,
    },
    "Insufficient color contrast": {
      advice: `Increase the contrast between the text and background colors. Current contrast ratio: ${details?.contrast?.toFixed(2)}:1 (minimum required: 4.5:1)`,
      severity: "major",
      wcag: "WCAG 2.1 Success Criterion 1.4.3 Contrast (Minimum) (Level AA)",
      impact: "Users with low vision may have difficulty reading the text",
      codeExample: `/* Example of good contrast */
.input {
  color: #333333; /* Dark gray */
  background-color: #FFFFFF; /* White */
  /* Contrast ratio: 12.63:1 */
}`,
    },
    "Missing focus indicator": {
      advice: "Add a visible focus indicator for keyboard navigation",
      severity: "critical",
      wcag: "WCAG 2.1 Success Criterion 2.4.7 Focus Visible (Level AA)",
      impact: "Keyboard users cannot see which element is currently focused",
      codeExample: `/* Visible focus styles */
input:focus {
  outline: 2px solid #4A90E2;
  outline-offset: 2px;
  /* Or */
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.5);
}`,
    },
  };

  return (
    issues[issue as IssueKey] || {
      advice: "Please review this accessibility issue",
      severity: "minor",
      wcag: "Unknown WCAG criterion",
      impact: "Impact not specified",
      codeExample: "// No example available",
    }
  );
};

export const hasAccessibleLabel = (element: HTMLElement): boolean => {
  const labels = (element as HTMLInputElement).labels;
  if (labels && labels.length > 0) {
    return true;
  }

  // Check ARIA attributes
  if (
    element.hasAttribute("aria-label") ||
    element.hasAttribute("aria-labelledby") ||
    element.hasAttribute("aria-describedby")
  ) {
    return true;
  }

  // Check for implicit label (parent label element)
  if (element.closest("label")) {
    return true;
  }

  // Check role combinations
  const role = element.getAttribute("role");
  if (role) {
    // Some roles like "presentation" or "none" don't need labels
    if (["presentation", "none"].includes(role)) {
      return true;
    }
  }

  // Check for button text content
  if (
    element.tagName.toLowerCase() === "button" &&
    element.textContent?.trim()
  ) {
    return true;
  }

  // Check type-specific cases
  if (element instanceof HTMLInputElement) {
    // Image inputs need alt text
    if (element.type === "image" && element.hasAttribute("alt")) {
      return true;
    }
    // Submit/Reset buttons use value as label
    if (["submit", "reset"].includes(element.type) && element.value) {
      return true;
    }
  }

  return false;
};

export const getBestPractices = (issues: AccessibilityIssue[]): string[] => {
  const practices = new Set<string>();

  if (issues.some((i) => i.severity === "critical")) {
    practices.add(
      "🚨 Address critical issues first as they severely impact accessibility",
    );
  }

  if (issues.some((i) => i.issue.includes("contrast"))) {
    practices.add("🎨 Use a color contrast checker during design phase");
  }

  if (issues.some((i) => i.issue.includes("label"))) {
    practices.add("🏷️ Always provide labels for form controls");
  }

  return Array.from(practices);
};

export const validateForms = async (): Promise<ValidationResult[]> => {
  const settings = await loadSettings();
  removeHighlights();
  const results: ValidationResult[] = [];

  for (const form of document.querySelectorAll("form")) {
    const formName =
      form.getAttribute("name") ||
      form.getAttribute("id") ||
      form.getAttribute("aria-label") ||
      `Form ${Array.from(document.forms).indexOf(form) + 1}`;
    const issues: AccessibilityIssue[] = [];
    const passingElements: Array<{
      element: string;
      elementType: string;
      elementPath: string;
    }> = [];
    const elements = {
      total: 0,
      withIssues: 0,
      passing: 0,
    };

    // Find form groups that should be fieldsets
    const formGroups: FormGroupValidation[] = [];
    const inputGroups = new Map<string, string[]>();
    form.querySelectorAll("input[name]").forEach((input) => {
      const name = input.getAttribute("name")?.replace(/\[\d*\]$/, "") || "";
      if (!inputGroups.has(name)) {
        inputGroups.set(name, []);
      }
      inputGroups.get(name)?.push(getElementIdentifier(input as HTMLElement));
    });

    inputGroups.forEach((fields, groupName) => {
      if (fields.length > 1) {
        formGroups.push({
          groupName,
          needsFieldset: true,
          fields,
        });
      }
    });

    // Validate error presentation at form level
    const errorPresentation = {
      hasErrorList: !!form.querySelector('[role="alert"]'),
      hasAriaInvalid: !!form.querySelector('[aria-invalid="true"]'),
      hasAriaDescribedby: !!form.querySelector('[aria-describedby*="error"]'),
    };

    const formControls = form.querySelectorAll(
      "input:not([type=hidden]), select, textarea, button",
    );

    for (const control of formControls) {
      elements.total++;
      const element = control as HTMLElement;
      let elementHasIssues = false;

      const details = {
        id: element.id,
        type:
          (element as HTMLInputElement).type || element.tagName.toLowerCase(),
        name: element.getAttribute("name"),
        value: (element as HTMLInputElement).value,
        path: getElementPath(element),
      };

      for (const rule of settings.rules) {
        if (!rule.enabled) continue;

        switch (rule.id) {
          case "label":
            if (!hasAccessibleLabel(element)) {
              elementHasIssues = true;
              const issue = "Missing label or aria-label";
              const advice = getAdvice(issue);
              issues.push({
                issue,
                element: getElementIdentifier(element),
                elementType: details.type,
                elementPath: details.path,
                ...advice,
              });
              addHighlight(element, {
                color: "#E53935",
                label: "Missing Label",
                severity: "critical",
              });
            }
            break;

          case "contrast":
            const style = window.getComputedStyle(element);
            const backgroundColor = parseColor(style.backgroundColor);
            const textColor = parseColor(style.color);
            const contrast = getContrastRatio(
              getLuminance(backgroundColor),
              getLuminance(textColor),
            );

            if (contrast < 4.5) {
              elementHasIssues = true;
              const issue = "Insufficient color contrast";
              const advice = getAdvice(issue, { contrast });
              issues.push({
                issue: `${issue}: ${contrast.toFixed(2)}:1`,
                element: getElementIdentifier(element),
                elementType: details.type,
                elementPath: details.path,
                value: `${contrast.toFixed(2)}:1`,
                ...advice,
              });
              addHighlight(element, {
                color: "#FB8C00",
                label: `Contrast: ${contrast.toFixed(2)}:1`,
                severity: "major",
              });
            }
            break;

          case "focus": {
            try {
              // Await the focus validation result
              const hasSufficientFocus = await validateFocusIndicator(element);

              if (!hasSufficientFocus) {
                elementHasIssues = true;
                const issue = "Missing focus indicator";
                const advice = getAdvice(issue);

                issues.push({
                  issue,
                  element: getElementIdentifier(element),
                  elementType: details.type,
                  elementPath: details.path,
                  ...advice,
                  value: "missing",
                });

                addHighlight(element, {
                  color: "#7B1FA2",
                  label: "Missing Focus",
                  severity: "critical",
                });
              }
            } catch (error) {
              console.error("Error checking focus indicator:", error);
            }
            break;
          }

          case "fieldset":
            if (
              formGroups.some(
                (group) =>
                  group.fields.includes(getElementIdentifier(element)) &&
                  !element.closest("fieldset"),
              )
            ) {
              elementHasIssues = true;
              issues.push({
                issue: "Related inputs should be grouped in fieldset",
                element: getElementIdentifier(element),
                elementType: details.type,
                elementPath: details.path,
                severity: "major",
                wcag: "1.3.1",
                impact: "Screen readers cannot understand input grouping",
                advice:
                  "Group related form controls using fieldset and legend elements",
                codeExample:
                  "<fieldset>\n  <legend>Group Name</legend>\n  <!-- inputs here -->\n</fieldset>",
              });
              addHighlight(element, {
                color: "#FB8C00",
                label: "Needs Fieldset",
                severity: "major",
              });
            }
            break;

          case "autocomplete":
            if (
              ["text", "email", "tel", "url", "search"].includes(details.type)
            ) {
              const hasAutocomplete = element.hasAttribute("autocomplete");
              if (!hasAutocomplete) {
                elementHasIssues = true;
                issues.push({
                  issue: "Missing autocomplete attribute",
                  element: getElementIdentifier(element),
                  elementType: details.type,
                  elementPath: details.path,
                  severity: "minor",
                  wcag: "1.3.5",
                  impact: "Users must manually enter common information",
                  advice: "Add appropriate autocomplete attribute",
                  codeExample: `<input type="${details.type}" autocomplete="[appropriate-value]">`,
                });
                addHighlight(element, {
                  color: "#7B1FA2",
                  label: "Add Autocomplete",
                  severity: "minor",
                });
              }
            }
            break;

          case "errorAssociation":
            const hasErrorAssociation =
              element.getAttribute("aria-invalid") === "true" &&
              element.hasAttribute("aria-describedby");
            if (!hasErrorAssociation && element.classList.contains("error")) {
              elementHasIssues = true;
              issues.push({
                issue: "Error state not properly associated",
                element: getElementIdentifier(element),
                elementType: details.type,
                elementPath: details.path,
                severity: "critical",
                wcag: "3.3.1",
                impact: "Screen readers cannot announce error states",
                advice:
                  "Use aria-invalid and aria-describedby to associate error messages",
                codeExample:
                  '<input aria-invalid="true" aria-describedby="error-message-id">',
              });
              addHighlight(element, {
                color: "#E53935",
                label: "Error Association",
                severity: "critical",
              });
            }
            break;
        }
      }

      if (elementHasIssues) {
        elements.withIssues++;
      } else {
        elements.passing++;
        passingElements.push({
          element: getElementIdentifier(element),
          elementType: details.type,
          elementPath: details.path,
        });
      }
    }

    const score = calculateScore(issues, elements.total, elements.passing);

    if (issues.length || elements.total > 0) {
      results.push({
        formName,
        issues,
        score,
        elements,
        bestPractices: getBestPractices(issues),
        passingElements,
        formGroups,
        errorPresentation,
      });
    }
  }

  return results;
};

export function initializeContentScript() {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.debug("Message received in content script:", message);
    try {
      switch (message.action) {
        case "validate-forms":
          validateForms().then((report) => {
            sendResponse({ results: report });
          });
          return true;
        case "simulate-impairment":
          applyColorBlindnessFilter(message.type);
          sendResponse({ success: true });
          break;
        case "reset-simulation":
          document.body.style.filter = "none";
          sendResponse({ success: true });
          break;
        case "ping":
          sendResponse({ success: true, timestamp: Date.now() });
          break;
        case "remove-highlights":
          removeHighlights();
          sendResponse({ success: true });
          break;
        case "checkFocusIndicator":
          if (document.activeElement instanceof HTMLElement) {
            const hasFocusIndicator = validateFocusIndicator(
              document.activeElement,
            );
            sendResponse({ success: true, hasFocusIndicator });
          } else {
            sendResponse({ success: false, error: "No active element" });
          }
          break;
        default:
          console.warn("Unknown action:", message.action);
          sendResponse({ success: false, error: "Unknown action" });
      }
    } catch (error) {
      console.error("Error in message listener:", error);
      sendResponse({ success: false, error: String(error) });
    }
    return true;
  });
}

initializeContentScript();
