let intervalFocused: number | undefined;
let timer = 0;
let startTime = 0;
let accumulatedTime = 0;
let focusEnabled = false;
let disableAutoplayEnabled = false;
let showRecsEnabled = false;
let currentUrl = '';
let darkTheme = true;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    timer, accumulatedTime, focusEnabled, disableAutoplayEnabled, showRecsEnabled, darkTheme
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'TOGGLE_FOCUS':
      toggleFocus();
      break;
    case 'GET_STATE':
      sendResponse({ timer, focusEnabled, isYouTube: isYouTube(), disableAutoplayEnabled, showRecsEnabled, darkTheme });
      break;
    case 'RESET':
      reset();
      break;
    case 'TOGGLE_AUTOPLAY':
      toggleAutoplay();
      break;
    case 'TOGGLE_RECS':
      toggleRecs();
      break;
    case 'TOGGLE_THEME':
      darkTheme = !darkTheme;
      chrome.storage.local.set({ darkTheme });
      break;
  }
  return true;
});

async function sendStateChanged(messageType: string) {
  const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: messageType, focusEnabled, disableAutoplayEnabled, showRecsEnabled });
    }
  }
}

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) {
    currentUrl = tab.url ?? '';
  }
  onLeavingYouTube();
  onEnteringYouTube();
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  currentUrl = tab.url ?? '';
  onLeavingYouTube();
  onEnteringYouTube();
});

function onEnteringYouTube() {
  if (isYouTube() && focusEnabled) {
    startTimer();
  }
}

function onLeavingYouTube() {
  if (!isYouTube() && focusEnabled)
    stopTimer();
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
  sendStateChanged('FOCUS_CHANGED');
  chrome.storage.local.set({ focusEnabled });
}

function toggleAutoplay() {
  disableAutoplayEnabled = !disableAutoplayEnabled;
  sendStateChanged('AUTOPLAY_CHANGED');
  chrome.storage.local.set({ disableAutoplayEnabled });
}

function toggleRecs() {
  showRecsEnabled = !showRecsEnabled;
  sendStateChanged('RECS_CHANGED');
  chrome.storage.local.set({ showRecsEnabled });
}

function reset() {
  timer = 0;
  accumulatedTime = 0;
  focusEnabled = false;
  if (intervalFocused) {
    clearInterval(intervalFocused);
    intervalFocused = undefined;
  }
  sendStateChanged('FOCUS_CHANGED');
  sendStateChanged('AUTOPLAY_CHANGED');
  sendStateChanged('RECS_CHANGED');
  chrome.storage.local.set({ timer, accumulatedTime, focusEnabled });

  chrome.action.setBadgeText({ text: undefined });
}

function startTimer() {
  if (intervalFocused || !isYouTube()) return;

  startTime = Date.now();
  intervalFocused = setInterval(() => {
    timer = (Date.now() - startTime) + accumulatedTime;
    chrome.storage.local.set({ timer, startTime, accumulatedTime });
    setBadgeTime();
  }, 100);
}

function stopTimer() {
  if (intervalFocused) {
    clearInterval(intervalFocused);
    intervalFocused = undefined;
    accumulatedTime = timer;
    chrome.storage.local.set({ timer, startTime, accumulatedTime });
  }
}

function setBadgeTime() {
  let minutes = Math.floor(timer / (60 * 1000));
  minutes = Math.min(minutes, 99);
  const minutesStr = minutes.toString().padStart(2, '0');
  const seconds = (Math.floor(timer / 1000) % 60).toString().padStart(2, '0');
  chrome.action.setBadgeText({ text: `${minutesStr}:${seconds}` });
}

async function loadState() {
  const result = await chrome.storage.local.get(['timer', 'accumulatedTime', 'focusEnabled', 'disableAutoplayEnabled', 'showRecsEnabled', 'darkTheme']);
  timer = Number(result.timer) || 0;
  accumulatedTime = Number(result.accumulatedTime) || 0;
  focusEnabled = Boolean(result.focusEnabled);
  disableAutoplayEnabled = Boolean(result.disableAutoplayEnabled);
  showRecsEnabled = Boolean(result.showRecsEnabled);
  darkTheme = Boolean(result.darkTheme);

  if (timer !== 0) setBadgeTime();
  if (focusEnabled) startTimer();
}

loadState();