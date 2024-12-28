import { Settings, ValidationRule } from "../types/settingsTypes";

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

export const loadSettings = async (): Promise<Settings> => {
  try {
    const stored = await chrome.storage.sync.get("settings");
    return stored.settings || defaultSettings;
  } catch (error) {
    console.warn("Failed to load settings:", error);
    return defaultSettings;
  }
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  await chrome.storage.sync.set({ settings });
};
