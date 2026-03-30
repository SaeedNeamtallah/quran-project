// ===== Configuration =====
const THEMES = new Set(['mint', 'lavender', 'sky', 'rose', 'sand']);
const READING_MODES = new Set(['rub', 'challenge', 'page']);
const FONT_SIZES = new Set(['1.2rem', '1.6rem', '2rem', '2.6rem', '3.2rem']);

function readStoredJson(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || 'null');
    } catch {
        return null;
    }
}

function clampInt(value, min, max, fallback) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
}

function readOptionalInt(value, min, max) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed)) return null;
    return Math.min(max, Math.max(min, parsed));
}

function normalizeConfig(input = {}) {
    return {
        studyDuration: clampInt(input.studyDuration, 1, 120, 30),
        breakDuration: clampInt(input.breakDuration, 1, 60, 15),
        rubCount: clampInt(input.rubCount, 1, 8, 1),
        theme: THEMES.has(input.theme) ? input.theme : 'mint',
        readingMode: READING_MODES.has(input.readingMode) ? input.readingMode : 'rub',
        challengeSurah: clampInt(input.challengeSurah, 1, 114, 18),
        challengePage: clampInt(input.challengePage, 1, 9999, 1),
        mushafPage: clampInt(input.mushafPage, 1, 604, 1),
        fontSize: FONT_SIZES.has(input.fontSize) ? input.fontSize : '2rem'
    };
}

function normalizeStats(input = {}) {
    return {
        pomodoros: clampInt(input.pomodoros, 0, 1000000, 0),
        rubs: clampInt(input.rubs, 0, 1000000, 0)
    };
}

let config = normalizeConfig(readStoredJson('quranic_pomodoro_config') || {});
let stats = normalizeStats(readStoredJson('quranic_pomodoro_stats') || {});
let runtimeState = {
    currentRub: clampInt(readStoredJson('quranic_pomodoro_runtime')?.currentRub, 1, 240, 1)
};
let apiStatusCache = null;
let quranDataCache = null;
let readerFocusEnabled = false;

function persistConfig() {
    localStorage.setItem('quranic_pomodoro_config', JSON.stringify(config));
}

function persistStats() {
    localStorage.setItem('quranic_pomodoro_stats', JSON.stringify(stats));
}

function persistRuntimeState() {
    localStorage.setItem('quranic_pomodoro_runtime', JSON.stringify(runtimeState));
}

persistConfig();
persistStats();
persistRuntimeState();

let STUDY_TIME = config.studyDuration * 60;
let BREAK_TIME = config.breakDuration * 60;
let timeRemaining = STUDY_TIME;
let isStudyMode = true;
let timerId = null;

// ===== DOM Elements =====
const $ = id => document.getElementById(id);

const timeDisplay   = $('time-left');
const startBtn      = $('start-btn');
const pauseBtn      = $('pause-btn');
const resetBtn      = $('reset-btn');
const skipBtn       = $('skip-btn');
const modeTitle     = $('mode-title');
const modeSubtitle  = $('mode-subtitle');
const quranDisplay  = $('quran-display');
const versesContainer = $('verses-container');
const quranLoader   = $('quran-loader');
const hizbNumber    = $('hizb-number');
const body          = document.body;
const alarmSound    = $('alarm-sound');
const timerProgress = $('timer-progress');
const timerSection  = $('timer-section');
const readerContextLabel = $('reader-context-label');
const readerModePill = $('reader-mode-pill');
const readerSurahName = $('reader-surah-name');
const readerPageChip = $('reader-page-chip');
const readerJuzChip = $('reader-juz-chip');
const readerHizbChip = $('reader-hizb-chip');
const readerProgressFill = $('reader-progress-fill');
const readerProgressText = $('reader-progress-text');
const readerSideStatus = $('reader-side-status');
const readerSideMode = $('reader-side-mode');
const readerSessionGoal = $('reader-session-goal');
const readerLastPosition = $('reader-last-position');
const readerFocusBtn = $('reader-focus-btn');
const readerFocusLabel = $('reader-focus-label');
const readerFocusControl = $('reader-focus-control');
const timerSummary = document.querySelector('.timer-summary');
const CIRCUMFERENCE = 2 * Math.PI * 90; // 565.48
let alarmPrimed = false;

// Request notification permission on load
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Stats
const statsBtn      = $('stats-btn');
const statsModal    = $('stats-modal');
const closeStatsBtn = $('close-stats-btn');
const statPomodoros = $('stat-pomodoros');
const statRubs      = $('stat-rubs');

// Settings
const settingsBtn       = $('settings-btn');
const settingsModal     = $('settings-modal');
const closeSettingsBtn  = $('close-settings-btn');
const saveSettingsBtn   = $('save-settings-btn');
const studyDurInput     = $('study-duration');
const breakDurInput     = $('break-duration');
const rubCountInput     = $('rub-count');
const themeSelect       = $('theme-select');
const currentRubInput   = $('current-rub');
const readingModeSelect = $('reading-mode');
const challengeSurahInput = $('challenge-surah');
const rubGroup          = $('rub-group');
const surahGroup        = $('surah-group');
const pageGroup         = $('page-group');
const fontSizeSelect    = $('font-size');
const currentPageInput  = $('current-page');
const prevBtn           = $('prev-btn');
const nextBtn           = $('next-btn');

// ===== Surah Names =====
const surahNames = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس"
];

// Populate surah dropdown
surahNames.forEach((name, i) => {
    const opt = document.createElement('option');
    opt.value = i + 1;
    opt.textContent = `${i + 1}. ${name}`;
    challengeSurahInput.appendChild(opt);
});

// Populate rub' dropdown grouped by Juz with starting Surah names
const juzStartSurah = [1,2,2,3,4,4,5,6,7,8,9,11,12,15,17,18,21,23,25,27,29,33,36,39,41,46,51,58,67,78];

// Add a default "current" option
const defaultOpt = document.createElement('option');
defaultOpt.value = '';
defaultOpt.textContent = '— الإبقاء على الحالي —';
currentRubInput.appendChild(defaultOpt);

for (let juz = 0; juz < 30; juz++) {
    const surahIdx = juzStartSurah[juz] - 1; // 0-based
    const surahName = surahNames[surahIdx];
    const group = document.createElement('optgroup');
    group.label = `الجزء ${juz + 1} — ${surahName}`;
    
    for (let r = 0; r < 8; r++) {
        const rubNum = juz * 8 + r + 1;
        const opt = document.createElement('option');
        opt.value = rubNum;
        const hizbNum = Math.ceil(rubNum / 4);
        const quarterInHizb = ((rubNum - 1) % 4) + 1;
        const quarterLabel = ['الربع الأول', 'الربع الثاني', 'الربع الثالث', 'الربع الرابع'][quarterInHizb - 1];
        opt.textContent = `ربع ${rubNum} — الحزب ${hizbNum} (${quarterLabel})`;
        group.appendChild(opt);
    }
    currentRubInput.appendChild(group);
}

// ===== Reading Mode Toggle =====
function updateModeVisibility(mode) {
    rubGroup.classList.add('hidden');
    surahGroup.classList.add('hidden');
    pageGroup.classList.add('hidden');
    if (mode === 'challenge') surahGroup.classList.remove('hidden');
    else if (mode === 'page') pageGroup.classList.remove('hidden');
    else rubGroup.classList.remove('hidden');
}

readingModeSelect.addEventListener('change', e => updateModeVisibility(e.target.value));

// ===== Settings Functions =====
function initSettings() {
    studyDurInput.value = config.studyDuration;
    breakDurInput.value = config.breakDuration;
    rubCountInput.value = config.rubCount;
    themeSelect.value = config.theme || 'mint';
    currentRubInput.value = '';
    currentPageInput.value = '';
    readingModeSelect.value = config.readingMode || 'rub';
    challengeSurahInput.value = config.challengeSurah || 18;
    fontSizeSelect.value = config.fontSize || '2rem';
    updateModeVisibility(config.readingMode || 'rub');
}

function openSettingsModal() {
    initSettings();
    settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
    settingsModal.classList.add('hidden');
}

function openStatsModal() {
    updateStatsDisplay();
    statsModal.classList.remove('hidden');
}

function closeStatsModal() {
    statsModal.classList.add('hidden');
}

window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.openStatsModal = openStatsModal;
window.closeStatsModal = closeStatsModal;

function updateStatsDisplay() {
    statPomodoros.textContent = stats.pomodoros;
    statRubs.textContent = stats.rubs;
}

function applyTheme() {
    body.classList.remove('theme-mint', 'theme-lavender', 'theme-sky', 'theme-rose', 'theme-sand');
    body.classList.add(`theme-${config.theme || 'mint'}`);
    document.documentElement.style.setProperty('--quran-font-size', config.fontSize || '2rem');
}

function getReadingModeLabel(mode = config.readingMode) {
    if (mode === 'challenge') return 'تحدي السورة';
    if (mode === 'page') return 'صفحة المصحف';
    return 'ورد الأرباع';
}

function getVerseChapterId(verse) {
    if (Number.isInteger(verse?.chapter_id)) return verse.chapter_id;
    const key = String(verse?.verse_key || '');
    const parsed = Number.parseInt(key.split(':')[0], 10);
    return Number.isInteger(parsed) ? parsed : null;
}

function getUniqueSortedNumbers(values) {
    return [...new Set(values.filter(Number.isInteger))].sort((a, b) => a - b);
}

function formatRangeLabel(label, values) {
    if (!values.length) return `${label} --`;
    if (values.length === 1) return `${label} ${values[0]}`;
    return `${label} ${values[0]}-${values[values.length - 1]}`;
}

function describeSessionGoal(mode = config.readingMode) {
    if (mode === 'challenge') {
        return `مواصلة سورة ${surahNames[(config.challengeSurah || 1) - 1]}`;
    }
    if (mode === 'page') {
        return `${config.breakDuration} دقيقة مع صفحات المصحف`;
    }
    return config.rubCount === 1
        ? `${config.breakDuration} دقيقة لربع واحد`
        : `${config.breakDuration} دقيقة لـ ${config.rubCount} أرباع`;
}

function buildReaderMeta(verses, options = {}) {
    const safeVerses = Array.isArray(verses) ? verses.filter(Boolean) : [];
    const mode = options.mode || config.readingMode;
    const fallback = {
        modeLabel: getReadingModeLabel(mode),
        surahTitle: 'القراءة القرآنية',
        pageLabel: 'الصفحة --',
        juzLabel: 'الجزء --',
        hizbLabel: 'الحزب --',
        progressPercent: 0,
        progressText: 'جاهز لبدء القراءة',
        sidebarStatus: 'تهيئة القارئ',
        lastPosition: 'لم يبدأ بعد',
        sessionGoal: describeSessionGoal(mode),
        contextLabel: 'تجربة قراءة أوضح وأهدأ'
    };

    if (!safeVerses.length) return fallback;

    const chapterIds = getUniqueSortedNumbers(safeVerses.map(getVerseChapterId));
    const pages = getUniqueSortedNumbers(safeVerses.map(verse => verse.page_number));
    const juzs = getUniqueSortedNumbers(safeVerses.map(verse => verse.juz_number));
    const hizbs = getUniqueSortedNumbers(safeVerses.map(verse => verse.hizb_number));
    const rubs = getUniqueSortedNumbers(safeVerses.map(verse => verse.rub_el_hizb_number));

    let surahTitle = 'القراءة القرآنية';
    if (chapterIds.length === 1) {
        surahTitle = `سورة ${surahNames[chapterIds[0] - 1]}`;
    } else if (chapterIds.length > 1) {
        surahTitle = `من سورة ${surahNames[chapterIds[0] - 1]} إلى ${surahNames[chapterIds[chapterIds.length - 1] - 1]}`;
    }

    let progressPercent = 0;
    let progressText = 'متابعة القراءة';

    if (mode === 'challenge') {
        const totalRecords = options.totalRecords || safeVerses.length;
        const shownSoFar = Math.min(
            totalRecords,
            ((options.currentPage || 1) - 1) * (options.perPage || safeVerses.length) + safeVerses.length
        );
        progressPercent = totalRecords ? (shownSoFar / totalRecords) * 100 : 0;
        progressText = totalRecords
            ? `تم ${Math.round(progressPercent)}% من السورة`
            : 'متابعة السورة';
    } else if (mode === 'page') {
        const currentPage = options.currentPage || pages[pages.length - 1] || 1;
        progressPercent = (currentPage / 604) * 100;
        progressText = `الصفحة ${currentPage} من 604`;
    } else {
        const currentRub = rubs[rubs.length - 1] || options.currentRub || 1;
        progressPercent = (currentRub / 240) * 100;
        progressText = `الربع ${currentRub} من 240`;
    }

    const pageLabel = formatRangeLabel('الصفحة', pages);
    const juzLabel = formatRangeLabel('الجزء', juzs);
    const hizbLabel = formatRangeLabel('الحزب', hizbs);
    const lastPosition = pages.length ? pageLabel : (rubs.length ? formatRangeLabel('الربع', rubs) : surahTitle);

    return {
        modeLabel: getReadingModeLabel(mode),
        surahTitle,
        pageLabel,
        juzLabel,
        hizbLabel,
        progressPercent,
        progressText,
        sidebarStatus: surahTitle,
        lastPosition,
        sessionGoal: describeSessionGoal(mode),
        contextLabel: 'تجربة قراءة أقرب للمصحف'
    };
}

function updateReaderChrome(meta) {
    const details = meta || buildReaderMeta([], {});

    if (readerContextLabel) {
        readerContextLabel.textContent = isStudyMode ? 'بومودورو قرآني هادئ' : details.contextLabel;
    }
    if (readerModePill) readerModePill.textContent = details.modeLabel;
    if (readerSurahName) readerSurahName.textContent = details.surahTitle;
    if (readerPageChip) readerPageChip.textContent = details.pageLabel;
    if (readerJuzChip) readerJuzChip.textContent = details.juzLabel;
    if (readerHizbChip) readerHizbChip.textContent = details.hizbLabel;
    if (readerProgressFill) {
        readerProgressFill.style.width = `${Math.max(0, Math.min(100, details.progressPercent || 0))}%`;
    }
    if (readerProgressText) readerProgressText.textContent = details.progressText;
    if (readerSideStatus) readerSideStatus.textContent = details.sidebarStatus;
    if (readerSideMode) readerSideMode.textContent = details.modeLabel;
    if (readerSessionGoal) readerSessionGoal.textContent = details.sessionGoal;
    if (readerLastPosition) readerLastPosition.textContent = details.lastPosition;
}

function setStudyChrome() {
    updateReaderChrome({
        modeLabel: 'وقت التركيز',
        surahTitle: 'جلسة عمل عميق',
        pageLabel: `${config.studyDuration} دقيقة تركيز`,
        juzLabel: `${config.breakDuration} دقيقة قراءة`,
        hizbLabel: getReadingModeLabel(config.readingMode),
        progressPercent: STUDY_TIME ? ((STUDY_TIME - timeRemaining) / STUDY_TIME) * 100 : 0,
        progressText: `التركيز ${formatTime(timeRemaining)}`,
        sidebarStatus: 'جلسة التركيز',
        lastPosition: 'يبدأ الورد بعد انتهاء المؤقت',
        sessionGoal: `${config.studyDuration} دقيقة عمل عميق`,
        contextLabel: 'بومودورو قرآني هادئ'
    });
}

function setReaderFocus(enabled) {
    readerFocusEnabled = Boolean(enabled) && !isStudyMode;
    body.classList.toggle('reader-focus', readerFocusEnabled);

    const focusButtons = [readerFocusBtn, readerFocusControl].filter(Boolean);
    focusButtons.forEach(button => {
        button.setAttribute('aria-pressed', readerFocusEnabled ? 'true' : 'false');
        button.title = readerFocusEnabled ? 'إظهار الأدوات' : 'وضع التركيز';
        if (button === readerFocusControl || button === readerFocusFab) {
            button.textContent = readerFocusEnabled ? '⤡ إنهاء التركيز' : '⤢ تركيز';
        }
    });

    if (readerFocusLabel) {
        readerFocusLabel.textContent = readerFocusEnabled ? 'إظهار الأدوات' : 'تركيز';
    }
}

function updateReadingTimerInteraction() {
    if (!timerSummary) return;

    timerSummary.classList.remove('timer-start-ready');
    timerSummary.tabIndex = -1;
    timerSummary.setAttribute('role', 'group');
    timerSummary.setAttribute('aria-label', 'مؤقت جلسة القراءة');
}

// ===== Timer Functions =====
function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function updateDisplay() {
    timeDisplay.textContent = formatTime(timeRemaining);
    // Update tab title
    document.title = `${formatTime(timeRemaining)} — ${isStudyMode ? 'تركيز' : 'قرآن'} | Q Doro`;
    // Update progress ring
    updateProgressRing();
    if (isStudyMode) setStudyChrome();
}

function updateProgressRing() {
    const total = isStudyMode ? STUDY_TIME : BREAK_TIME;
    const fraction = timeRemaining / total;
    const offset = CIRCUMFERENCE * (1 - fraction);
    timerProgress.style.strokeDashoffset = offset;
}

function playAlarm() {
    alarmSound.currentTime = 0;
    alarmSound.play().catch(() => {});
}

async function primeAlarmAudio() {
    if (alarmPrimed) return;

    try {
        alarmSound.muted = true;
        await alarmSound.play();
        alarmSound.pause();
        alarmSound.currentTime = 0;
        alarmSound.muted = false;
        alarmPrimed = true;
    } catch {
        alarmSound.muted = false;
    }
}

function notifyModeSwitch() {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }

    const title = isStudyMode ? '⏱ وقت التركيز!' : '📖 استراحة قرآنية!';
    const bodyText = isStudyMode ? 'حان وقت العمل العميق' : 'جدد روحك بقراءة القرآن';

    try {
        new Notification(title, { body: bodyText });
    } catch (error) {
        console.warn('Notification failed:', error);
    }
}

function switchMode() {
    isStudyMode = !isStudyMode;
    timeRemaining = isStudyMode ? STUDY_TIME : BREAK_TIME;
    setReaderFocus(false);

    notifyModeSwitch();

    if (isStudyMode) {
        stats.rubs += config.rubCount;
        persistStats();
        updateStatsDisplay();

        body.classList.remove('mode-break');
        body.classList.add('mode-study');
        modeTitle.textContent = "وقت التركيز";
        modeSubtitle.textContent = `${config.studyDuration} دقيقة عمل عميق`;
        quranDisplay.classList.add('hidden');
        setStudyChrome();
    } else {
        stats.pomodoros += 1;
        persistStats();
        updateStatsDisplay();

        body.classList.remove('mode-study');
        body.classList.add('mode-break');
        modeTitle.textContent = "استراحة قرآنية";
        modeSubtitle.textContent = "جدد روحك بقراءة القرآن";
        quranDisplay.classList.remove('hidden');
        fetchQuranContent();
    }
    updateDisplay();
    pauseTimer();
}

async function hasBackend() {
    if (apiStatusCache !== null) return apiStatusCache;

    try {
        const res = await fetch('api/status', { cache: 'no-store' });
        apiStatusCache = res.ok;
    } catch {
        apiStatusCache = false;
    }

    return apiStatusCache;
}

async function loadOfflineQuranData() {
    if (quranDataCache) return quranDataCache;

    const res = await fetch('quran_offline.json', { cache: 'force-cache' });
    if (!res.ok) throw new Error(`Offline Quran data not found: ${res.status}`);
    quranDataCache = await res.json();
    return quranDataCache;
}

async function getCurrentRubPosition() {
    if (await hasBackend()) {
        const res = await fetch('api/status', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to read rub status: ${res.status}`);
        const data = await res.json();
        return clampInt(data.current_rub, 1, 240, 1);
    }

    return runtimeState.currentRub;
}

async function setRubPosition(rubNumber) {
    const normalizedRub = clampInt(rubNumber, 1, 240, 1);

    if (await hasBackend()) {
        const res = await fetch('api/set_rub', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rub_number: normalizedRub })
        });
        if (!res.ok) throw new Error(`Failed to set rub: ${res.status}`);
        return;
    }

    runtimeState.currentRub = normalizedRub;
    persistRuntimeState();
}

async function fetchRubContent(count) {
    const normalizedCount = clampInt(count, 1, 8, 1);

    if (await hasBackend()) {
        const res = await fetch(`api/rub?count=${normalizedCount}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to load rubs: ${res.status}`);
        return res.json();
    }

    const data = await loadOfflineQuranData();
    const startRub = runtimeState.currentRub;
    let currentRub = startRub;
    const verses = [];

    for (let index = 0; index < normalizedCount; index++) {
        verses.push(...(data.rubs[String(currentRub)] || []));
        currentRub = currentRub >= 240 ? 1 : currentRub + 1;
    }

    runtimeState.currentRub = currentRub;
    persistRuntimeState();

    const endRub = ((startRub - 1 + normalizedCount - 1) % 240) + 1;
    return {
        rub_number: normalizedCount > 1 ? `${startRub} - ${endRub}` : startRub,
        verses
    };
}

async function fetchPageContent(pageNumber) {
    const normalizedPage = clampInt(pageNumber, 1, 604, 1);

    if (await hasBackend()) {
        const res = await fetch(`api/page?page=${normalizedPage}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to load page: ${res.status}`);
        return res.json();
    }

    const data = await loadOfflineQuranData();
    return { verses: data.pages[String(normalizedPage)] || [] };
}

async function fetchSurahChallengeContent(chapter, page, perPage) {
    const normalizedChapter = clampInt(chapter, 1, 114, 18);
    const normalizedPage = clampInt(page, 1, 9999, 1);
    const normalizedPerPage = clampInt(perPage, 1, 200, 15);

    if (await hasBackend()) {
        const res = await fetch(
            `api/surah_challenge?chapter=${normalizedChapter}&page=${normalizedPage}&per_page=${normalizedPerPage}`,
            { cache: 'no-store' }
        );
        if (!res.ok) throw new Error(`Failed to load challenge: ${res.status}`);
        return res.json();
    }

    const data = await loadOfflineQuranData();
    const verses = data.chapters[String(normalizedChapter)] || [];
    const start = (normalizedPage - 1) * normalizedPerPage;
    const end = start + normalizedPerPage;
    return {
        verses: verses.slice(start, end),
        pagination: {
            current_page: normalizedPage,
            next_page: end < verses.length ? normalizedPage + 1 : null,
            total_records: verses.length
        }
    };
}

// ===== Quran Fetching =====
function buildVersesHtml(verses) {
    let html = '<div class="mushaf-layout">';
    verses.forEach(v => {
        html += `<span class="ayah-container"><span class="ayah-text">${v.text_uthmani}</span><span class="ayah-number">${v.verse_number}</span></span>`;
    });
    html += '</div>';
    return html;
}

async function fetchQuranContent() {
    versesContainer.innerHTML = '';
    quranLoader.classList.remove('hidden');

    try {
        if (config.readingMode === 'challenge') {
            versesContainer.classList.remove('mushaf-page-style');
            const perPage = config.rubCount * 15;
            const displayPage = config.challengePage || 1;
            const data = await fetchSurahChallengeContent(config.challengeSurah || 18, displayPage, perPage);
            const meta = buildReaderMeta(data.verses, {
                mode: 'challenge',
                currentPage: displayPage,
                perPage,
                totalRecords: data.pagination?.total_records
            });

            const name = surahNames[(config.challengeSurah || 18) - 1];
            hizbNumber.textContent = `تحدي: سورة ${name} • ${meta.pageLabel}`;

            versesContainer.innerHTML = buildVersesHtml(data.verses);
            quranLoader.classList.add('hidden');
            updateReaderChrome(meta);

            const nextPg = data.pagination?.next_page;
            if (nextPg) {
                config.challengePage = nextPg;
            } else {
                config.challengePage = 1;
                hizbNumber.textContent += " — 🎉 اكتملت السورة!";
            }
            persistConfig();

        } else if (config.readingMode === 'page') {
            versesContainer.classList.add('mushaf-page-style');
            const pg = config.mushafPage || 1;
            const data = await fetchPageContent(pg);
            const meta = buildReaderMeta(data.verses, {
                mode: 'page',
                currentPage: pg
            });

            hizbNumber.textContent = `${meta.pageLabel} • ${meta.juzLabel}`;
            versesContainer.innerHTML = buildVersesHtml(data.verses);
            quranLoader.classList.add('hidden');
            updateReaderChrome(meta);

            config.mushafPage = pg >= 604 ? 1 : pg + 1;
            persistConfig();

        } else {
            versesContainer.classList.remove('mushaf-page-style');
            const data = await fetchRubContent(config.rubCount);
            const meta = buildReaderMeta(data.verses, {
                mode: 'rub'
            });

            hizbNumber.textContent = `${formatRangeLabel('ربع الحزب', getUniqueSortedNumbers(data.verses.map(verse => verse.rub_el_hizb_number)))} • ${meta.hizbLabel}`;
            versesContainer.innerHTML = buildVersesHtml(data.verses);
            quranLoader.classList.add('hidden');
            updateReaderChrome(meta);
        }
    } catch (err) {
        console.error('Error fetching Quran:', err);
        quranLoader.classList.add('hidden');
        versesContainer.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-secondary);">حدث خطأ في تحميل الآيات. تأكد من وجود quran_offline.json أو تشغيل السيرفر المحلي.</div>';
        updateReaderChrome({
            modeLabel: getReadingModeLabel(config.readingMode),
            surahTitle: 'تعذر تحميل موضع القراءة',
            pageLabel: 'الصفحة --',
            juzLabel: 'الجزء --',
            hizbLabel: 'الحزب --',
            progressPercent: 0,
            progressText: 'تعذر تحميل المحتوى',
            sidebarStatus: 'خطأ في التحميل',
            lastPosition: 'تحقق من quran_offline.json',
            sessionGoal: describeSessionGoal(config.readingMode),
            contextLabel: 'تجربة قراءة أقرب للمصحف'
        });
    }
}

// ===== Timer Controls =====
function startTimer() {
    if (timerId !== null) return;
    startBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    updateReadingTimerInteraction();
    timerId = setInterval(() => {
        timeRemaining--;
        updateDisplay();
        if (timeRemaining <= 0) {
            pauseTimer();
            playAlarm();
            switchMode();
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerId);
    timerId = null;
    pauseBtn.classList.add('hidden');
    startBtn.classList.remove('hidden');
    updateReadingTimerInteraction();
}

function resetTimer() {
    pauseTimer();
    timeRemaining = isStudyMode ? STUDY_TIME : BREAK_TIME;
    updateDisplay();
}

async function handleSkipClick(event) {
    event?.preventDefault?.();

    // Make skip deterministic even if another element overlaps the control.
    if (timerId !== null) {
        pauseTimer();
    }

    switchMode();
}

// ===== Event Listeners =====

// Settings
settingsBtn.addEventListener('click', openSettingsModal);
closeSettingsBtn.addEventListener('click', closeSettingsModal);
$('settings-overlay').addEventListener('click', closeSettingsModal);

saveSettingsBtn.addEventListener('click', async () => {
    config.studyDuration = clampInt(studyDurInput.value, 1, 120, 30);
    config.breakDuration = clampInt(breakDurInput.value, 1, 60, 15);
    config.rubCount = clampInt(rubCountInput.value, 1, 8, 1);
    config.theme = THEMES.has(themeSelect.value) ? themeSelect.value : 'mint';
    config.fontSize = FONT_SIZES.has(fontSizeSelect.value) ? fontSizeSelect.value : '2rem';

    const mode = readingModeSelect.value;
    if (mode === 'challenge') {
        const newSurah = clampInt(challengeSurahInput.value, 1, 114, 18);
        if (config.challengeSurah !== newSurah || config.readingMode !== 'challenge') {
            config.challengePage = 1;
        }
        config.challengeSurah = newSurah;
        config.readingMode = 'challenge';
    } else if (mode === 'page') {
        config.readingMode = 'page';
        const newPage = readOptionalInt(currentPageInput.value, 1, 604);
        if (newPage !== null) config.mushafPage = newPage;
    } else {
        config.readingMode = 'rub';
        const newRub = readOptionalInt(currentRubInput.value, 1, 240);
        if (newRub !== null) {
            try {
                await setRubPosition(newRub);
            } catch (e) { console.error('Failed to set Rub:', e); }
        }
    }

    if (!isStudyMode) fetchQuranContent();

    persistConfig();
    applyTheme();
    STUDY_TIME = config.studyDuration * 60;
    BREAK_TIME = config.breakDuration * 60;
    modeSubtitle.textContent = isStudyMode ? `${config.studyDuration} دقيقة عمل عميق` : "جدد روحك بقراءة القرآن";
    resetTimer();
    if (isStudyMode) setStudyChrome();
    closeSettingsModal();
});

// Stats
statsBtn.addEventListener('click', openStatsModal);
closeStatsBtn.addEventListener('click', closeStatsModal);
$('stats-overlay').addEventListener('click', closeStatsModal);

const focusToggleButtons = [readerFocusBtn, readerFocusControl].filter(Boolean);
focusToggleButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (isStudyMode) return;
        setReaderFocus(!readerFocusEnabled);
    });
});

document.addEventListener('keydown', event => {
    const activeTag = event.target?.tagName;
    const isTyping = ['INPUT', 'SELECT', 'TEXTAREA'].includes(activeTag) || event.target?.isContentEditable;

    if (event.key === 'Escape' && readerFocusEnabled) {
        setReaderFocus(false);
        return;
    }

    if (isTyping || isStudyMode || !settingsModal.classList.contains('hidden') || !statsModal.classList.contains('hidden')) {
        return;
    }

    if (event.key === 'ArrowRight') {
        event.preventDefault();
        navigateQuran(-1);
    } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        navigateQuran(1);
    } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setReaderFocus(!readerFocusEnabled);
    }
});

// ===== Quran Navigation (Prev / Next) =====
async function navigateQuran(direction) {
    // direction: 1 = next, -1 = prev
    if (config.readingMode === 'page') {
        // config.mushafPage holds the *next* page to show. 
        // We want to move from the *currently displayed* page.
        const currentDisplayed = (config.mushafPage - 1) || 604;
        let target = currentDisplayed + direction;
        if (target < 1) target = 604;
        if (target > 604) target = 1;
        config.mushafPage = target;
        fetchQuranContent();
    } else if (config.readingMode === 'challenge') {
        const nextPg = (config.challengePage || 1) + direction;
        if (nextPg < 1) return;
        config.challengePage = nextPg;
        fetchQuranContent();
    } else {
        // Rub mode: state is on backend.
        // nextBtn -> just fetch again (auto-advances)
        // prevBtn -> move state back by (2 * count) then fetch
        if (direction === 1) {
            fetchQuranContent();
        } else {
            try {
                const currentInState = await getCurrentRubPosition();
                const count = config.rubCount || 1;
                let target = currentInState - (count * 2);
                while (target < 1) target += 240;
                
                await setRubPosition(target);
                fetchQuranContent();
            } catch (e) {
                console.error("Failed to navigate rub:", e);
                fetchQuranContent();
            }
        }
    }
    persistConfig();
}

prevBtn.addEventListener('click', () => navigateQuran(-1));
nextBtn.addEventListener('click', () => navigateQuran(1));

// Timer buttons
startBtn.addEventListener('click', async () => {
    await primeAlarmAudio();
    startTimer();
});
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
skipBtn.addEventListener('click', handleSkipClick);

// ===== Init =====
initSettings();
applyTheme();
setReaderFocus(false);
updateStatsDisplay();
modeSubtitle.textContent = `${config.studyDuration} دقيقة عمل عميق`;
setStudyChrome();
updateDisplay();
updateReadingTimerInteraction();
