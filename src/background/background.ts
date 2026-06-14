let intervalFocused: number | undefined;
let timer = 0;
let startTime = 0;
let accumulatedTime = 0;
let focusEnabled = false;
let currentUrl = '';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'TOGGLE_FOCUS':
      toggleFocus();
      break;
    case 'GET_STATE':
      sendResponse({ timer, focusEnabled, isYouTube: isYouTube() });
      break;
    case 'RESET':
      reset();
      break;
  }
  return true;
});

async function sendToContentScript() {
  const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'FOCUS_CHANGED', focusEnabled });
    }
  }
}

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) {
    currentUrl = tab.url ?? '';
  }
  onLeavingYouTube();
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  currentUrl = tab.url ?? '';
  onLeavingYouTube();
});

function onLeavingYouTube() {
  if (!isYouTube() && focusEnabled)
    toggleFocus();
}

function isYouTube(): boolean {
  return currentUrl.includes('youtube.com');
}

function toggleFocus() {
  focusEnabled = !focusEnabled;
  if (focusEnabled) {
    startTimer();
  } else {
    stopTimer();
  }
  sendToContentScript();
  chrome.storage.local.set({ focusEnabled });
}

function reset() {
  timer = 0;
  accumulatedTime = 0;
  focusEnabled = false;
  if (intervalFocused) clearInterval(intervalFocused);
  sendToContentScript();
  chrome.storage.local.set({ timer, accumulatedTime, focusEnabled });
}

function startTimer() {
  startTime = Date.now();
  intervalFocused = setInterval(() => {
    timer = (Date.now() - startTime) + accumulatedTime;
    chrome.storage.local.set({ timer });
  }, 100);
}

function stopTimer() {
  if (intervalFocused) {
    clearInterval(intervalFocused);
    accumulatedTime = timer;
    chrome.storage.local.set({ accumulatedTime });
  }
}

async function loadState() {
  const result = await chrome.storage.local.get(['timer', 'accumulatedTime', 'focusEnabled']);
  timer = Number(result.timer) || 0;
  accumulatedTime = Number(result.accumulatedTime) || 0;
  focusEnabled = Boolean(result.focusEnabled) || false;

  if (focusEnabled) {
    startTimer();
  }
}

loadState();