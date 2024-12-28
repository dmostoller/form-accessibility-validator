// Basic types
type FocusStyle = {
  outline: string;
  outlineOffset: string;
  border: string;
  boxShadow: string;
  backgroundColor: string;
  color: string;
  hasFocusClass: boolean;
};

// Constants
const MIN_WIDTH = 2; // WCAG requires at least 2px
const DEBUG = false;

const FOCUS_CLASS_INDICATORS = [
  "focus-ring",
  "focus-visible",
  "focused",
  "focus-within",
  "focus-outline",
];

const hasFocusClass = (element: HTMLElement): boolean => {
  const classList = Array.from(element.classList);
  return FOCUS_CLASS_INDICATORS.some((className) =>
    classList.some((cl) => cl.includes(className)),
  );
};

// Parse dimension more robustly
const getDimension = (value: string): number => {
  // Handle multiple values (e.g. "1px solid black")
  const dimensions = value.match(/\d+(\.\d+)?px/g);
  if (!dimensions) return 0;
  // Return largest found dimension
  return Math.max(...dimensions.map((d) => parseFloat(d)));
};

const normalizeColor = (color: string): string => {
  color = color.toLowerCase().trim();
  if (color === "transparent" || color === "initial" || color === "inherit") {
    return color;
  }
  // Convert rgb/rgba to lowercase and remove spaces
  return color.replace(/\s+/g, "");
};

const isTransparent = (color: string): boolean => {
  color = normalizeColor(color);
  return (
    color === "transparent" ||
    color === "rgba(0,0,0,0)" ||
    color === "rgba(0,0,0,0.0)" ||
    (color.includes("rgba") && color.match(/,[0-9.]+\)$/)?.[0] === ",0)") ||
    color === "initial"
  );
};

const normalizeValue = (value: string): string => {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
};

const isEmptyValue = (value: string): boolean => {
  const normalized = normalizeValue(value);
  return ["", "none", "initial", "0px"].includes(normalized);
};

const resolveCustomProperty = (
  element: HTMLElement,
  property: string,
): string => {
  if (!property.includes("var(--")) return property;
  const computed = getComputedStyle(element);
  return property.replace(/var\((--[^)]+)\)/g, (match, prop) => {
    return computed.getPropertyValue(prop).trim() || match;
  });
};

const getFocusStylesFromRules = (element: HTMLElement): Partial<FocusStyle> => {
  const styles: Partial<FocusStyle> = {};
  const sheets = document.styleSheets;

  try {
    for (const sheet of sheets) {
      // Skip external stylesheets
      if (!sheet.cssRules) continue;

      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSStyleRule) {
          if (
            rule.selectorText?.includes(":focus") &&
            element.matches(rule.selectorText.replace(/:focus/g, ""))
          ) {
            const style = rule.style;
            if (style.outline) styles.outline = style.outline;
            if (style.outlineOffset) styles.outlineOffset = style.outlineOffset;
            if (style.border) styles.border = style.border;
            if (style.boxShadow) styles.boxShadow = style.boxShadow;
            if (style.backgroundColor)
              styles.backgroundColor = style.backgroundColor;
            if (style.color) styles.color = style.color;
          }
        }
      }
    }
  } catch (e) {
    console.warn("Error reading style rules:", e);
  }

  return styles;
};

// Get computed styles for normal and focus states
const getStyles = async (
  element: HTMLElement,
): Promise<{ normal: FocusStyle; focus: FocusStyle }> => {
  // Get initial state
  const computed = getComputedStyle(element);
  const normalStyles = {
    outline: resolveCustomProperty(
      element,
      computed.getPropertyValue("outline"),
    ),
    outlineOffset: resolveCustomProperty(
      element,
      computed.getPropertyValue("outline-offset"),
    ),
    border: resolveCustomProperty(element, computed.getPropertyValue("border")),
    boxShadow: resolveCustomProperty(
      element,
      computed.getPropertyValue("box-shadow"),
    ),
    backgroundColor: resolveCustomProperty(
      element,
      computed.getPropertyValue("background-color"),
    ),
    color: resolveCustomProperty(element, computed.getPropertyValue("color")),
    hasFocusClass: hasFocusClass(element),
  };

  // Create style observer
  let focusStyles: FocusStyle | null = null;
  const observer = new MutationObserver(() => {
    const currentComputed = getComputedStyle(element);
    focusStyles = {
      outline: resolveCustomProperty(
        element,
        currentComputed.getPropertyValue("outline"),
      ),
      outlineOffset: resolveCustomProperty(
        element,
        currentComputed.getPropertyValue("outline-offset"),
      ),
      border: resolveCustomProperty(
        element,
        currentComputed.getPropertyValue("border"),
      ),
      boxShadow: resolveCustomProperty(
        element,
        currentComputed.getPropertyValue("box-shadow"),
      ),
      backgroundColor: resolveCustomProperty(
        element,
        currentComputed.getPropertyValue("background-color"),
      ),
      color: resolveCustomProperty(
        element,
        currentComputed.getPropertyValue("color"),
      ),
      hasFocusClass: hasFocusClass(element),
    };
  });

  // Inject temporary focus styles to force browser to compute them
  const styleElement = document.createElement("style");
  styleElement.textContent = `
    *:focus { 
      outline: auto !important;
      transition: none !important;
    }
  `;
  document.head.appendChild(styleElement);

  // Start observing
  observer.observe(element, {
    attributes: true,
    attributeFilter: ["style", "class"],
  });

  // Focus element and get computed styles
  element.focus();

  return new Promise((resolve) => {
    setTimeout(() => {
      const focusComputed = getComputedStyle(element);
      const cssRuleFocusStyles = getFocusStylesFromRules(element);

      const computedFocusStyles = {
        outline: resolveCustomProperty(
          element,
          focusComputed.getPropertyValue("outline"),
        ),
        outlineOffset: resolveCustomProperty(
          element,
          focusComputed.getPropertyValue("outline-offset"),
        ),
        border: resolveCustomProperty(
          element,
          focusComputed.getPropertyValue("border"),
        ),
        boxShadow: resolveCustomProperty(
          element,
          focusComputed.getPropertyValue("box-shadow"),
        ),
        backgroundColor: resolveCustomProperty(
          element,
          focusComputed.getPropertyValue("background-color"),
        ),
        color: resolveCustomProperty(
          element,
          focusComputed.getPropertyValue("color"),
        ),
        hasFocusClass: hasFocusClass(element),
      };

      // Cleanup
      observer.disconnect();
      element.blur();
      styleElement.remove();

      // Merge all focus styles, prioritizing observed changes
      const mergedFocusStyles = {
        ...computedFocusStyles,
        ...cssRuleFocusStyles,
        ...focusStyles,
      } as FocusStyle;

      if (DEBUG) {
        console.log("Normal:", normalStyles);
        console.log("Focus (computed):", computedFocusStyles);
        console.log("Focus (CSS rules):", cssRuleFocusStyles);
        console.log("Focus (observed):", focusStyles);
        console.log("Focus (merged):", mergedFocusStyles);
      }

      resolve({ normal: normalStyles, focus: mergedFocusStyles });
    }, 100);
  });
};

export const validateFocusIndicator = async (
  element: HTMLElement,
): Promise<boolean> => {
  try {
    const { normal, focus } = await getStyles(element);

    const hasOutlineChange =
      focus.outline !== normal.outline &&
      !isTransparent(focus.outline) &&
      !isEmptyValue(focus.outline) &&
      getDimension(focus.outline) >= MIN_WIDTH;

    const hasVisibleChange =
      hasOutlineChange ||
      focus.hasFocusClass ||
      (focus.border !== normal.border &&
        getDimension(focus.border) >= MIN_WIDTH);

    return hasVisibleChange;
  } catch (error) {
    console.error("Focus validation error:", error);
    return false;
  }
};

// ...existing code for Chrome extension...

// Chrome extension interface
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "checkFocusIndicator" && request.element) {
      validateFocusIndicator(request.element)
        .then((result) =>
          sendResponse({ success: true, hasFocusIndicator: result }),
        )
        .catch((error) =>
          sendResponse({ success: false, error: String(error) }),
        );
      return true; // Keep channel open for async response
    }
  });
}
