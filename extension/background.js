// LifeOS Memory Capture - Background Service Worker
// Automatically captures browsing activity and sends to backend

const BACKEND_URL = 'http://localhost:8001/ingest/extension';

// Track recently captured URLs to avoid duplicates
let recentUrls = [];
const DEDUPE_WINDOW_MS = 30000; // 30 seconds

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    autoCapture: true,
    capturedPages: [],
    lastError: null
  });
  console.log('LifeOS Memory Capture extension installed');
});

// Listen for tab updates - capture when page finishes loading
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only capture when page is fully loaded
  if (changeInfo.status !== 'complete') return;

  // Skip internal Chrome pages and extension pages
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('extension://') || tab.url.startsWith('chrome-extension://')) {
    return;
  }

  // Check if auto-capture is enabled
  const { autoCapture } = await chrome.storage.local.get('autoCapture');
  if (!autoCapture) return;

  // Debounce: check if we recently captured this URL
  const now = Date.now();
  const recentCapture = recentUrls.find(item => item.url === tab.url && (now - item.timestamp) < DEDUPE_WINDOW_MS);
  if (recentCapture) {
    console.log('Skipping duplicate URL:', tab.url);
    return;
  }

  // Capture the page content
  await capturePage(tabId, tab);
});

// Capture page content from a tab
async function capturePage(tabId, tab) {
  try {
    // Inject script to extract readable content
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: extractPageContent
    });

    if (!results || !results[0]) {
      console.error('Failed to extract content from tab:', tabId);
      return;
    }

    const { title, content } = results[0].result;

    if (!content || content.length < 50) {
      console.log('Skipping page - insufficient content:', tab.url);
      return;
    }

    // Add to recent URLs
    recentUrls.push({ url: tab.url, timestamp: Date.now() });
    // Clean up old entries
    recentUrls = recentUrls.filter(item => Date.now() - item.timestamp < DEDUPE_WINDOW_MS);

    // Send to backend
    await sendToBackend(title, tab.url, content);

  } catch (error) {
    console.error('Error capturing page:', error);
    await updateStatus(null, `Capture error: ${error.message}`);
  }
}

// Script injected into the page to extract content
function extractPageContent() {
  // Get page title
  const title = document.title || window.location.href;

  // Extract main readable content
  // Priority: article content, main content, then body text
  let content = '';

  // Try to find main content areas
  const selectors = [
    'article',
    '[role="main"]',
    'main',
    '.post-content',
    '.article-content',
    '.entry-content',
    '.content',
    '#content',
    '.post',
    '.article'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      content = extractTextContent(element);
      if (content.length > 200) break;
    }
  }

  // Fallback to body if no main content found
  if (!content || content.length < 200) {
    content = extractTextContent(document.body);
  }

  // Clean and truncate
  content = content.replace(/\s+/g, ' ').trim();
  if (content.length > 5000) {
    content = content.substring(0, 5000) + '...';
  }

  return { title, content };
}

// Extract text content, filtering out nav, ads, scripts
function extractTextContent(element) {
  // Clone to avoid modifying the page
  const clone = element.cloneNode(true);

  // Remove unwanted elements
  const removeSelectors = [
    'nav', 'header', 'footer', 'aside',
    'script', 'style', 'noscript', 'iframe',
    '.nav', '.navigation', '.menu', '.sidebar',
    '.ads', '.ad', '.advertisement',
    '.social', '.share', '.sharing',
    '.comments', '.comment',
    '.related', '.recommended',
    '[role="navigation"]', '[role="banner"]', '[role="complementary"]'
  ];

  for (const selector of removeSelectors) {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  }

  // Get text content
  return clone.textContent || clone.innerText || '';
}

// Send captured content to backend
async function sendToBackend(title, url, content) {
  const payload = {
    text: `[${title}]\nURL: ${url}\n\n${content}`,
    source: 'chrome_extension',
    url: url,
    title: title,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Successfully captured:', title);

    // Update captured pages list
    await updateCapturedPages(title, url, true, null);

  } catch (error) {
    console.error('Failed to send to backend:', error);
    await updateCapturedPages(title, url, false, error.message);
  }
}

// Update the list of captured pages in storage
async function updateCapturedPages(title, url, success, error) {
  const { capturedPages = [] } = await chrome.storage.local.get('capturedPages');

  // Add new entry
  const newEntry = {
    title: title.substring(0, 50) + (title.length > 50 ? '...' : ''),
    url,
    success,
    error,
    timestamp: new Date().toISOString()
  };

  // Keep only last 10 pages
  capturedPages.unshift(newEntry);
  if (capturedPages.length > 10) {
    capturedPages.pop();
  }

  await chrome.storage.local.set({
    capturedPages,
    lastError: error
  });
}

// Update last error in storage
async function updateStatus(title, error) {
  await chrome.storage.local.set({ lastError: error });
}

// Manual capture triggered from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureCurrentPage') {
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        await capturePage(tab.id, tab);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No active tab' });
      }
    })();
    return true; // Keep channel open for async response
  }
});
