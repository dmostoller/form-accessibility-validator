interface HighlightOptions {
  color: string;
  label: string;
  severity: "critical" | "major" | "minor";
}

const getExistingHighlightsCount = (element: HTMLElement): number => {
  const elementRect = element.getBoundingClientRect();
  const highlights = document.querySelectorAll(".a11y-highlight");
  let count = 0;

  highlights.forEach((highlight) => {
    const rect = highlight.getBoundingClientRect();
    if (rect.top === elementRect.top && rect.left === elementRect.left) {
      count++;
    }
  });

  return count;
};

export const addHighlight = (
  element: HTMLElement,
  options: HighlightOptions,
) => {
  const rect = element.getBoundingClientRect();
  const highlight = document.createElement("div");
  const position = getExistingHighlightsCount(element);

  highlight.className = "a11y-highlight";
  highlight.style.cssText = `
    position: absolute;
    top: ${rect.top + window.scrollY}px;
    left: ${rect.left + window.scrollX}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    border: 2px solid ${options.color};
    border-radius: 3px;
    pointer-events: none;
    z-index: 999999;
  `;

  const label = document.createElement("div");
  label.className = "a11y-highlight-label";
  label.textContent = options.label;
  label.style.cssText = `
    position: absolute;
    top: ${-24 - position * 22}px;
    left: 0;
    background: ${options.color};
    color: white;
    padding: 2px 6px;
    font-size: 12px;
    border-radius: 3px;
  `;

  highlight.appendChild(label);
  document.body.appendChild(highlight);
};

export const removeHighlights = () => {
  document.querySelectorAll(".a11y-highlight").forEach((el) => el.remove());
};
