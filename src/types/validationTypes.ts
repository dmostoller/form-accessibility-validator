export interface AccessibilityIssue {
  issue: string;
  element: string;
  elementType: string;
  elementPath: string;
  severity: "all" | "critical" | "major" | "minor";
  wcag: string;
  impact: string;
  advice: string;
  codeExample: string;
  value?: string;
}

export interface FormGroupValidation {
  groupName: string;
  needsFieldset: boolean;
  fields: string[];
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface ValidationResult {
  formName: string;
  issues: AccessibilityIssue[];
  score: AccessibilityScore;
  elements: {
    total: number;
    withIssues: number;
    passing: number;
  };
  bestPractices: string[];
  passingElements: Array<{
    element: string;
    elementType: string;
    elementPath: string;
  }>;
  formGroups: FormGroupValidation[];
  errorPresentation: {
    hasErrorList: boolean;
    hasAriaInvalid: boolean;
    hasAriaDescribedby: boolean;
  };
}

export interface AccessibilityScore {
  overall: number;
  breakdown: {
    critical: number;
    major: number;
    minor: number;
  };
}

export interface ValidationSettings {
  rules: Array<{
    id: string;
    name: string;
    enabled: boolean;
    severity: "all" | "critical" | "major" | "minor";
  }>;
  contrast: {
    minimumRatio: number;
    largeTextRatio: number;
  };
  display: {
    showPassingElements: boolean;
    showElementPaths: boolean;
    showCodeExamples: boolean;
  };
}
