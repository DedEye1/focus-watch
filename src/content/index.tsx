let styleShorts: HTMLStyleElement | null = null;
let styleRecs: HTMLStyleElement | null = null;
let styleAutoplay: HTMLStyleElement | null = null;
let observer: MutationObserver | null = null;

function hideShorts() {
  if (styleShorts) return;

  styleShorts = document.createElement('style');
  styleShorts.id = 'focus-watch-hide';
  styleShorts.textContent = `
    a[href*="/shorts/"],
    ytd-rich-shelf-renderer,
    ytd-reel-shelf-renderer,
    grid-shelf-view-model,
    [title*="Shorts"],
    [tab-title*="Shorts"],
    [aria-label*="Shorts"] {
      display: none !important;
      }
      `;
  document.head.appendChild(styleShorts);
}

function restoreFully() {
  if (styleShorts) {
    styleShorts.remove();
    styleShorts = null;
  }
  restoreAutoplay();
  restoreRecs();
}

function hideRecs() {
  if (styleRecs) return;

  styleRecs = document.createElement('style');
  styleRecs.id = 'recs-hide';
  styleRecs.textContent = `
    #comments,
    #secondary {
      display: none !important;
    }
  `;
  document.head.appendChild(styleRecs);
}

function restoreRecs() {
  if (styleRecs) {
    styleRecs.remove();
    styleRecs = null;
  }
}

function startObserver() {
  if (observer) return;

  observer = new MutationObserver(() => {
    if (styleShorts && !document.getElementById('focus-watch-hide')) {
      document.head.appendChild(styleShorts);
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
        hideShorts();
        startObserver();
        if (message.disableAutoplayEnabled) disableAutoplay();
        if (!message.showRecsEnabled) hideRecs();
      } else {
        restoreFully();
        stopObserver();
      }
      break;
    case 'AUTOPLAY_CHANGED':
      if (message.focusEnabled) disableAutoplay();
      if (!message.disableAutoplayEnabled) restoreAutoplay();
      break;
    case 'RECS_CHANGED':
      if (message.focusEnabled) hideRecs();
      if (message.showRecsEnabled) restoreRecs();
      break;
  }
});

async function init() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
  if (response.focusEnabled) {
    hideShorts();
    startObserver();
    if (response.disableAutoplayEnabled) disableAutoplay();
    if (!response.showRecsEnabled) hideRecs();
  }
}

init();