export type ValidationRuleId =
  | "label"
  | "contrast"
  | "focus"
  | "fieldset"
  | "autocomplete"
  | "errorList"
  | "errorAssociation";

export interface ValidationRule {
  id: ValidationRuleId;
  name: string;
  description?: string;
  enabled: boolean;
  severity: "critical" | "major" | "minor";
  wcag?: string;
  examples?: string[];
}

export interface Settings {
  rules: ValidationRule[];
  contrast: {
    minimumRatio: number;
    largeTextRatio: number;
  };
  display: {
    showPassingElements: boolean;
    showElementPaths: boolean;
    showCodeExamples: boolean;
    severityFilter: "all" | "critical" | "major" | "minor";
  };
  errorStates?: {
    requireErrorSummary: boolean;
    requireAriaInvalid: boolean;
    requireAriaDescribedby: boolean;
  };
}
