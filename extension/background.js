// Background Service Worker for Bookmarks Extension
// Keeps the extension alive and handles background tasks

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Bookmarks Extension installed');

    // Optional: Open welcome page on first install
    chrome.tabs.create({
      url: 'https://bookmarks-cristoj.web.app'
    });
  } else if (details.reason === 'update') {
    console.log('Bookmarks Extension updated to version', chrome.runtime.getManifest().version);
  }
});

// Keep service worker alive - handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);

  // Handle different message types (for future use)
  if (message.type === 'PING') {
    sendResponse({ pong: true });
  }

  return true; // Keep message channel open for async response
});

console.log('Bookmarks Extension background service worker loaded');
