import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "./App";
import { chromeMock } from "../test/chrome.mock";

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    render(<App />);
  });

  describe("Core UI", () => {
    it("renders main interface elements", () => {
      expect(
        screen.getByText("Form Accessibility Validator"),
      ).toBeInTheDocument();
      expect(screen.getByText("Validate Forms")).toBeInTheDocument();
      expect(screen.getByLabelText("Toggle Settings")).toBeInTheDocument();
    });

    it("toggles settings view", () => {
      const settingsButton = screen.getByLabelText("Toggle Settings");
      fireEvent.click(settingsButton);
      expect(screen.getByText("Validator Settings")).toBeInTheDocument();

      fireEvent.click(settingsButton);
      expect(screen.queryByText("Validator Settings")).not.toBeInTheDocument();
    });
  });

  describe("Form Controls", () => {
    it("shows loading state when validating", async () => {
      // Setup delayed response
      chromeMock.tabs.sendMessage.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true }), 100),
          ),
      );

      render(<App />);

      const validateButton = screen.getAllByText("Validate Forms")[0];
      fireEvent.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText("Validating...")).toBeInTheDocument();
      });
    });

    it("disables report generation when no results", () => {
      const reportButton = screen.getByText("Generate Report");
      expect(reportButton).toBeDisabled();
    });
  });
});
