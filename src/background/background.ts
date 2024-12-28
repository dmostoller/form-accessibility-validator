chrome.runtime.onInstalled.addListener(() => {
  console.debug("Form Accessibility Validator installed!");
});

// Helper function to check if URL is supported
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    // Removed "chrome-extension:" to prevent injection into extension pages
    return ["http:", "https:", "file:"].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

// Helper function for content script injection
const injectContentScript = async (tabId: number) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    console.debug(`Attempting to inject into tab ${tabId} with URL ${tab.url}`);

    if (!isValidUrl(tab.url)) {
      throw new Error(
        "Invalid URL protocol. Only HTTP(S) pages are supported.",
      );
    }

    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });

    console.debug(`Successfully injected script into tab ${tabId}`);
  } catch (error) {
    console.error("Failed to inject content script:", error);
    throw new Error(
      "Cannot validate this page. Only HTTP(S) pages are supported.",
    );
  }
};

// Single popup creation listener
chrome.action.onClicked.addListener((tab) => {
  // Removed chrome.windows.create to use default_popup instead
  if (tab.id && isValidUrl(tab.url)) {
    injectContentScript(tab.id);
  }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && isValidUrl(tab.url)) {
    try {
      await injectContentScript(tabId);
    } catch (error) {
      console.error("Tab update injection failed:", error);
    }
  }
});
