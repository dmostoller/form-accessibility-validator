import { useState, useEffect } from "react";
import "./styles.css";
import { downloadReport } from "../utils/reportUtils";
import { ReportFormat } from "../types/reportTypes";
import { ValidationResult, AccessibilityScore } from "@/types/validationTypes";
import SettingsPage from "./Settings";
import { useSettings } from "../context/SettingsContext";

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    className={`w-3 h-3 transition-transform ${
      expanded ? "transform rotate-90" : ""
    }`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

type SimulationType = "none" | "protanopia" | "deuteranopia" | "tritanopia";
interface AppProps {
  initialHighlightsEnabled?: boolean;
}

export default function App({ initialHighlightsEnabled = true }: AppProps) {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const { settings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [simulationType, setSimulationType] = useState<SimulationType>("none");
  const [highlightsEnabled, setHighlightsEnabled] = useState(
    initialHighlightsEnabled,
  );
  const [expandedCodeExamples, setExpandedCodeExamples] = useState<number[]>(
    [],
  );
  const [reportFormat, setReportFormat] = useState<ReportFormat>(
    ReportFormat.PDF,
  );
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>(
    {},
  );
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    validateForms();
  }, []);

  const filteredResults = results.map((result) => ({
    ...result,
    issues: result.issues.filter(
      (issue) =>
        settings.display.severityFilter === "all" ||
        issue.severity === settings.display.severityFilter,
    ),
  }));

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const validateForms = async () => {
    setLoading(true);
    setError(null);

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab.id || !tab.url) {
        throw new Error("No active tab found");
      }

      if (!tab.url.startsWith("http")) {
        throw new Error(
          "Cannot validate this page. Only HTTP(S) pages are supported.",
        );
      }

      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // console.log("Content script injection check");
            return true;
          },
        });

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
          world: "MAIN",
        });
      } catch (e) {
        if (e instanceof Error) {
          throw new Error(`Failed to inject content script: ${e.message}`);
        }
      }

      let retries = 3;
      while (retries > 0) {
        try {
          const pingResponse = await chrome.tabs.sendMessage(tab.id, {
            action: "ping",
            timestamp: Date.now(),
          });

          if (pingResponse?.success) {
            setIsConnected(true);
            break;
          }
          throw new Error("Invalid ping response");
        } catch (e) {
          retries--;
          if (retries === 0) {
            setIsConnected(false);
            throw new Error(
              "Unable to connect to page. Please refresh and try again.",
            );
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "validate-forms",
        settings,
        simulationType,
      });

      if (chrome.runtime.lastError) {
        throw new Error(
          chrome.runtime.lastError.message || "Chrome runtime error",
        );
      }

      if (!response || !Array.isArray(response.results)) {
        throw new Error("Invalid response format");
      }

      setResults(response.results);
    } catch (error) {
      console.error("Validation error:", error);
      setResults([]);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSimulationChange = async (type: SimulationType) => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab.id) throw new Error("No active tab found");

      if (type === "none") {
        await chrome.tabs.sendMessage(tab.id, { action: "reset-simulation" });
      } else {
        await chrome.tabs.sendMessage(tab.id, {
          action: "simulate-impairment",
          type,
        });
      }
      setSimulationType(type);
    } catch (error) {
      console.error("Simulation error:", error);
      setError("Failed to apply color simulation");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-400";
      case "major":
        return "text-yellow-400";
      case "minor":
        return "text-blue-400";
      default:
        return "text-purple-200";
    }
  };

  const renderScoreBreakdown = (score: AccessibilityScore) => (
    <div className="mt-2 text-sm">
      <div className="grid grid-cols-3 gap-2">
        <div className="text-red-400">Critical: {score.breakdown.critical}</div>
        <div className="text-yellow-400">Major: {score.breakdown.major}</div>
        <div className="text-blue-400">Minor: {score.breakdown.minor}</div>
      </div>
    </div>
  );

  const togglePath = (pathId: string) => {
    setExpandedPaths((prev) => ({
      ...prev,
      [pathId]: !prev[pathId],
    }));
  };

  const toggleCodeExample = (index: number) => {
    setExpandedCodeExamples((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const handleGenerateReport = async () => {
    if (results.length === 0) {
      setError("Please validate forms first before generating a report");
      return;
    }
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentUrl = tabs[0]?.url || "Unknown page";

      await downloadReport(results, reportFormat, currentUrl);
    } catch (error) {
      setError("Failed to generate report");
      console.error(error);
    }
  };

  return (
    <div className="w-[600px] min-h-screen bg-[var(--background)] text-[var(--text)]">
      <div className="flex justify-between items-center p-4 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <img
            src="/icons/icon32.png"
            alt="Logo"
            width={32}
            height={32}
            className="rounded-sm"
          />
          <h1 className="text-xl font-bold">Form Accessibility Validator</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-haiti-700/20 rounded-full transition-colors"
            aria-label="Toggle Settings"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
          <button
            onClick={() => window.close()}
            className="p-2 hover:bg-haiti-700/20 rounded-full transition-colors"
            aria-label="Close extension"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      {showSettings ? (
        <SettingsPage />
      ) : (
        <>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 p-2">
              <label htmlFor="simulation" className="text-sm whitespace-nowrap">
                Color Vision Simulation:
              </label>
              <select
                id="simulation"
                aria-label="Color vision simulation type"
                value={simulationType}
                onChange={(e) =>
                  handleSimulationChange(e.target.value as SimulationType)
                }
                className="flex-1 px-2 py-1 text-sm bg-[var(--surface)] border border-[var(--border)] rounded"
              >
                <option value="none">No Simulation</option>
                <option value="protanopia">Protanopia (Red-Deficient)</option>
                <option value="deuteranopia">
                  Deuteranopia (Green-Deficient)
                </option>
                <option value="tritanopia">Tritanopia (Blue-Deficient)</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={validateForms}
                className={`flex-1 py-3 px-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg text-white font-medium transition-all ${
                  loading ? "cursor-not-allowed opacity-50" : "hover:shadow-lg"
                }`}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? "Validating..." : "Validate Forms"}
              </button>
              <button
                onClick={async () => {
                  setHighlightsEnabled(!highlightsEnabled);
                  const [activeTab] = await chrome.tabs.query({
                    active: true,
                    currentWindow: true,
                  });
                  if (activeTab?.id) {
                    chrome.tabs.sendMessage(activeTab.id, {
                      action: highlightsEnabled
                        ? "remove-highlights"
                        : "validate-forms",
                    });
                  }
                }}
                aria-pressed={highlightsEnabled}
                data-testid="highlight-toggle"
                className="text-xs px-3 py-1 rounded bg-haiti-700/20 hover:bg-haiti-700/30"
              >
                {highlightsEnabled ? "Hide Highlights" : "Show Highlights"}
              </button>
              <select
                aria-label="Report format selection"
                value={reportFormat}
                onChange={(e) =>
                  setReportFormat(e.target.value as ReportFormat)
                }
                className="px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg"
              >
                <option value={ReportFormat.PDF}>PDF</option>
                <option value={ReportFormat.JSON}>JSON</option>
                <option value={ReportFormat.MARKDOWN}>Markdown</option>
              </select>
              <button
                onClick={handleGenerateReport}
                className={`px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg font-medium transition-all hover:bg-[var(--primary)] hover:text-white ${
                  results.length === 0 ? "cursor-not-allowed opacity-50" : ""
                }`}
                disabled={results.length === 0}
              >
                Generate Report
              </button>
            </div>

            {error && (
              <div
                className="bg-[var(--error-bg)] border border-[var(--error-border)] text-[var(--error-text)] p-3 rounded-lg"
                role="alert"
                aria-live="polite"
              >
                <p>{error}</p>
                {!isConnected && (
                  <button
                    onClick={() => {
                      chrome.tabs.query(
                        { active: true, currentWindow: true },
                        function (tabs) {
                          if (tabs[0]?.id) {
                            chrome.tabs.reload(tabs[0].id);
                            window.location.reload();
                          }
                        },
                      );
                    }}
                    className="mt-2 text-sm underline hover:text-[var(--error-hover)]"
                  >
                    Retry Connection
                  </button>
                )}
              </div>
            )}

            <div className="space-y-4">
              {filteredResults.map((result, index) => (
                <div
                  key={index}
                  className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)]"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">{result.formName}</h2>
                    <span
                      className={`text-lg font-bold ${
                        result.score.overall > 70
                          ? "text-green-400"
                          : result.score.overall > 40
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      Score: {result.score.overall}%
                    </span>
                  </div>

                  {renderScoreBreakdown(result.score)}

                  <div className="mt-3 text-sm opacity-80">
                    <p>
                      Elements: {result.elements.total} total,{" "}
                      {result.elements.passing} passing,{" "}
                      {result.elements.withIssues} with issues
                    </p>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => toggleSection(`form-${index}`)}
                      aria-label={`${expandedSections[`form-${index}`] ? "Hide" : "Show"} form details`}
                      aria-expanded={expandedSections[`form-${index}`]}
                      className="flex items-center hover:text-haiti-400"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          expandedSections[`form-${index}`]
                            ? "transform rotate-90"
                            : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      <span className="ml-2">
                        {expandedSections[`form-${index}`] ? "Hide" : "Show"}{" "}
                        Details
                      </span>
                    </button>
                  </div>

                  {expandedSections[`form-${index}`] && (
                    <>
                      <div className="mt-4">
                        <h3 className="font-semibold mb-2">Best Practices:</h3>
                        <ul className="list-disc list-inside text-sm opacity-90">
                          {result.bestPractices.map((practice, i) => (
                            <li key={i}>{practice}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 space-y-4">
                        {result.issues.map((issue, i) => (
                          <div
                            key={i}
                            className="bg-[var(--surface)] p-3 rounded border border-[var(--border)]"
                          >
                            <div
                              className={`text-sm ${getSeverityColor(
                                issue.severity,
                              )} font-semibold`}
                            >
                              {issue.severity.toUpperCase()}
                            </div>
                            <div className="mt-2 text-sm opacity-90">
                              <p>
                                <strong>Issue:</strong> {issue.issue}
                              </p>
                              <p>
                                <strong>Element:</strong> {issue.element}
                              </p>
                              <p>
                                <strong>WCAG:</strong> {issue.wcag}
                              </p>
                              <p>
                                <strong>Advice:</strong> {issue.advice}
                              </p>
                              {settings.display.showElementPaths && (
                                <div>
                                  <button
                                    onClick={() => togglePath(`issue-${i}`)}
                                    aria-label={`${expandedPaths[`issue-${i}`] ? "Hide" : "Show"} element path`}
                                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] flex items-center gap-1"
                                  >
                                    <strong>Path:</strong>
                                    <ChevronIcon
                                      expanded={expandedPaths[`issue-${i}`]}
                                    />
                                    <span className="text-xs">
                                      {expandedPaths[`issue-${i}`]
                                        ? "Hide"
                                        : "Show"}
                                    </span>
                                  </button>
                                  {expandedPaths[`issue-${i}`] && (
                                    <p className="mt-1 pl-4 text-xs break-all">
                                      {issue.elementPath}
                                    </p>
                                  )}
                                </div>
                              )}
                              {settings.display.showCodeExamples && (
                                <div>
                                  <button
                                    onClick={() => toggleCodeExample(i)}
                                    aria-label={`${expandedCodeExamples.includes(i) ? "Hide" : "Show"} code example`}
                                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] flex items-center gap-1"
                                  >
                                    <strong>Code Example:</strong>
                                    <ChevronIcon
                                      expanded={expandedCodeExamples.includes(
                                        i,
                                      )}
                                    />
                                    <span className="text-xs">
                                      {expandedCodeExamples.includes(i)
                                        ? "Hide"
                                        : "Show"}
                                    </span>
                                  </button>
                                  {expandedCodeExamples.includes(i) && (
                                    <div className="mt-2 bg-[var(--surface-dark)] rounded-lg p-4">
                                      <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-medium">
                                          {issue.issue}
                                        </h4>
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(
                                              issue.codeExample,
                                            );
                                            setCopiedIndex(i);
                                            setTimeout(
                                              () => setCopiedIndex(null),
                                              2000,
                                            );
                                          }}
                                          aria-label={`Copy code example for ${issue.issue}`}
                                          className="text-xs px-2 py-1 rounded bg-haiti-700/20 hover:bg-haiti-700/30 transition-colors relative"
                                        >
                                          {copiedIndex === i ? (
                                            <span className="text-green-400">
                                              Copied!
                                            </span>
                                          ) : (
                                            "Copy"
                                          )}
                                        </button>
                                      </div>

                                      <pre className="text-xs bg-[var(--surface-darker)] p-3 rounded overflow-x-auto">
                                        <code>{issue.codeExample}</code>
                                      </pre>

                                      {issue.advice && (
                                        <p className="mt-2 text-xs text-[var(--text-muted)]">
                                          {issue.advice}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {settings.display.showPassingElements && (
                        <div className="mt-4">
                          <h3 className="font-semibold mb-2 text-green-400">
                            Passing Elements:
                          </h3>
                          <div className="mt-4 space-y-4">
                            {result.passingElements.map((element, i) => (
                              <div
                                key={i}
                                className="bg-green-500/10 p-3 rounded border border-green-500/20"
                              >
                                <div className="text-sm text-green-400 font-semibold">
                                  PASSING
                                </div>
                                <div className="mt-2 text-sm opacity-90">
                                  <p>
                                    <strong>Element:</strong> {element.element}
                                  </p>
                                  <p>
                                    <strong>Type:</strong> {element.elementType}
                                  </p>
                                  {settings.display.showElementPaths && (
                                    <div>
                                      <button
                                        onClick={() =>
                                          togglePath(`passing-${i}`)
                                        }
                                        className="text-sm text-green-400/70 hover:text-green-400 flex items-center gap-1"
                                      >
                                        <strong>Path:</strong>
                                        <ChevronIcon
                                          expanded={
                                            expandedPaths[`passing-${i}`]
                                          }
                                        />
                                        <span className="text-xs">
                                          {expandedPaths[`passing-${i}`]
                                            ? "Hide"
                                            : "Show"}
                                        </span>
                                      </button>
                                      {expandedPaths[`passing-${i}`] && (
                                        <p className="mt-1 pl-4 text-xs break-all">
                                          {element.elementPath}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
