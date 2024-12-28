export interface Score {
  overall: number;
  breakdown: {
    critical: number;
    major: number;
    minor: number;
  };
}

export interface Elements {
  total: number;
  passing: number;
  withIssues: number;
}

export interface Issue {
  severity: string;
  issue: string;
  element: string;
  elementType: string;
  wcag: string;
  impact: string;
  advice: string;
  elementPath: string;
  codeExample?: string;
}

export interface PassingElement {
  element: string;
  elementType: string;
  attributes?: { [key: string]: string };
}

export interface ValidationResult {
  formName: string;
  score: Score;
  elements: Elements;
  bestPractices: string[];
  issues: Issue[];
  passingElements: PassingElement[];
}

export enum ReportFormat {
  JSON = "json",
  PDF = "pdf",
  MARKDOWN = "md",
}
