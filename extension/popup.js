// LifeOS Memory Capture - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('autoCaptureToggle');
  const captureBtn = document.getElementById('captureBtn');
  const pageList = document.getElementById('pageList');

  // Load current auto-capture state
  const { autoCapture = true } = await chrome.storage.local.get('autoCapture');
  toggle.checked = autoCapture;

  // Load captured pages
  await loadCapturedPages();

  // Handle toggle change
  toggle.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await chrome.storage.local.set({ autoCapture: enabled });
    console.log('Auto-capture:', enabled ? 'enabled' : 'disabled');
  });

  // Handle manual capture button
  captureBtn.addEventListener('click', async () => {
    captureBtn.disabled = true;
    captureBtn.textContent = 'Capturing...';

    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'captureCurrentPage' }, resolve);
      });

      if (response && response.success) {
        captureBtn.textContent = 'Captured!';
        setTimeout(() => {
          captureBtn.textContent = 'Capture This Page Now';
        }, 2000);
      } else {
        captureBtn.textContent = 'Capture Failed';
        setTimeout(() => {
          captureBtn.textContent = 'Capture This Page Now';
        }, 2000);
      }
    } catch (error) {
      captureBtn.textContent = 'Error';
      setTimeout(() => {
        captureBtn.textContent = 'Capture This Page Now';
      }, 2000);
    }

    captureBtn.disabled = false;

    // Refresh the page list
    await loadCapturedPages();
  });

  // Listen for storage changes to update the page list in real-time
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.capturedPages) {
      renderCapturedPages(changes.capturedPages.newValue || []);
    }
  });
});

async function loadCapturedPages() {
  const { capturedPages = [] } = await chrome.storage.local.get('capturedPages');
  renderCapturedPages(capturedPages);
}

function renderCapturedPages(pages) {
  const pageList = document.getElementById('pageList');

  if (pages.length === 0) {
    pageList.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <div>No pages captured yet</div>
      </div>
    `;
    return;
  }

  // Show last 5 pages
  const recentPages = pages.slice(0, 5);

  pageList.innerHTML = recentPages.map(page => `
    <div class="page-item">
      <div class="status-icon ${page.success ? 'success' : 'error'}">
        ${page.success
          ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
        }
      </div>
      <div class="page-info">
        <div class="page-title" title="${escapeHtml(page.title)}">${escapeHtml(page.title)}</div>
        <div class="page-url" title="${escapeHtml(page.url)}">${escapeHtml(page.url')}</div>
        ${page.error ? `<div class="error-message">Failed to sync: ${escapeHtml(page.error)}</div>` : ''}
      </div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
