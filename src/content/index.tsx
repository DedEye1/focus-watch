let styleBase: HTMLStyleElement | null = null;
let styleAutoplay: HTMLStyleElement | null = null;
let observer: MutationObserver | null = null;

function hideDistractions() {
  if (styleBase) return;

  styleBase = document.createElement('style');
  styleBase.id = 'focus-watch-hide';
  styleBase.textContent = `
    #secondary,
    a[href*="/shorts/"],
    ytd-rich-section-renderer,
    ytd-reel-shelf-renderer,
    grid-shelf-view-model,
    #comments,
    [title*="Shorts"],
    [tab-title*="Shorts"],
    [aria-label*="Shorts"] {
      display: none !important;
    }
  `;
  document.head.appendChild(styleBase);
}

function restoreDistractions() {
  if (styleBase) {
    styleBase.remove();
    styleBase = null;
  }
  restoreAutoplay();
}

function startObserver() {
  if (observer) return;

  observer = new MutationObserver(() => {
    if (styleBase && !document.getElementById('focus-watch-hide')) {
      document.head.appendChild(styleBase);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function stopObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

function disableAutoplay() {
  hideAutoplay();
  const autoplayButton = document.querySelector<HTMLButtonElement>('button[data-tooltip-target-id="ytp-autonav-toggle-button"]');
  const stateElement = autoplayButton?.querySelector<HTMLDivElement>('[aria-checked]');
  const state = stateElement?.getAttribute('aria-checked');
  if (autoplayButton && state === 'true')
    autoplayButton.click();
}

function hideAutoplay() {
  if (styleAutoplay) return;

  styleAutoplay = document.createElement('style');
  styleAutoplay.id = 'auto-play-hide';
  styleAutoplay.textContent = `
    [data-tooltip-target-id*="ytp-autonav-toggle-button"] {
      display: none !important;
    }
  `;
  document.head.appendChild(styleAutoplay);
}

function restoreAutoplay() {
  if (styleAutoplay) {
    styleAutoplay.remove();
    styleAutoplay = null;
  }
}

chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case 'FOCUS_CHANGED':
      if (message.focusEnabled) {
        hideDistractions();
        startObserver();
        if (message.disableAutoplayEnabled) disableAutoplay();
      } else {
        restoreDistractions();
        stopObserver();
      }
      break;
    case 'AUTOPLAY_CHANGED':
      if (message.focusEnabled) disableAutoplay();
      if (!message.disableAutoplayEnabled) restoreAutoplay();
      break;
  }
});

async function init() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
  if (response.focusEnabled) {
    hideDistractions();
    startObserver();
    if (response.disableAutoplayEnabled) disableAutoplay();
  }
}

init();