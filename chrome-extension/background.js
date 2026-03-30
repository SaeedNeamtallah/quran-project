// =====================================================
// background.js — Service Worker
// Handles timer alarm + browser notifications when popup is closed
// =====================================================

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'pomodoroEnd') return;

  const stored = await chrome.storage.local.get(['timerState', 'config', 'stats']);
  const cfg    = stored.config     || {};
  const state  = stored.timerState || {};
  const stats  = stored.stats      || { pomodoros: 0, rubs: 0 };

  if (!state.isRunning) return;

  const studyDuration = (cfg.studyDuration || 30) * 60;
  const breakDuration = (cfg.breakDuration || 15) * 60;
  const rubCount      = cfg.rubCount || 1;
  const wasStudy      = state.isStudyMode;
  const nowStudy      = !wasStudy;

  // Update stats & advance rub
  if (nowStudy) {
    // Break ended -> back to study
    stats.rubs += rubCount;
    state.currentRub = ((state.currentRub || 1) - 1 + rubCount) % 240 + 1;
  } else {
    // Study ended -> break starts
    stats.pomodoros += 1;
  }

  const newState = {
    ...state,
    isStudyMode:     nowStudy,
    isRunning:       false,
    startTime:       null,
    totalDuration:   nowStudy ? studyDuration : breakDuration,
    pausedRemaining: null,
  };

  await chrome.storage.local.set({ timerState: newState, stats });

  // Notification
  const title   = nowStudy ? '⏱ وقت التركيز!' : '📖 استراحة قرآنية!';
  const message = nowStudy
    ? 'انتهت الاستراحة — حان وقت العمل العميق'
    : 'أحسنت! جدد روحك بقراءة القرآن الكريم';

  chrome.notifications.create('sessionDone', {
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title,
    message,
    priority: 2,
  });

  // Tell popup if it's open
  chrome.runtime.sendMessage({ type: 'TIMER_ENDED', state: newState }).catch(() => {});
});
// Open extension in a new window when icon is clicked
chrome.action.onClicked.addListener(() => {
  const width = 800;
  const height = 900;
  
  chrome.windows.getCurrent(async (win) => {
    let left = win.left + Math.round((win.width - width) / 2);
    let top = win.top + Math.round((win.height - height) / 2);
    
    // Ensure window doesn't open off-screen
    left = Math.max(0, left);
    top = Math.max(0, top);

    chrome.windows.create({
      url: 'popup.html',
      type: 'popup',
      width: width,
      height: height,
      left: left,
      top: top
    });
  });
});
