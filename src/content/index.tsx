let style: HTMLStyleElement | null = null;
let observer: MutationObserver | null = null;

function addStyles() {
  if (style) return;

  style = document.createElement('style');
  style.id = 'focus-watch-hide';
  style.textContent = `
    #secondary,
    a[href*="/shorts/"],
    ytd-rich-section-renderer,
    ytd-reel-shelf-renderer,
    #comments,
    [title*="Shorts"] {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

function removeStyles() {
  if (style) {
    style.remove();
    style = null;
  }
}

function startObserver() {
  if (observer) return;

  observer = new MutationObserver(() => {
    if (style && !document.getElementById('focus-watch-hide')) {
      document.head.appendChild(style);
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

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'FOCUS_CHANGED') {
    if (message.focusEnabled) {
      addStyles();
      startObserver();
    } else {
      removeStyles();
      stopObserver();
    }
  }
});

async function init() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
  if (response.focusEnabled) {
    addStyles();
    startObserver();
  }
}

init();