// =====================================================
// popup.js — Quranic Pomodoro Chrome Extension
// Reads Quran data directly from bundled quran_offline.json
// Timer state persisted via chrome.storage.local
// =====================================================

const CIRCUMFERENCE = 2 * Math.PI * 90; // 565.48
const THEMES = new Set(['mint', 'dark', 'lavender', 'sky', 'rose', 'sand']);
const READING_MODES = new Set(['rub', 'challenge', 'page']);
const FONT_SIZES = new Set(['1.5rem', '1.9rem', '2.4rem']);

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
        fontSize: FONT_SIZES.has(input.fontSize) ? input.fontSize : '1.9rem'
    };
}

function normalizeStats(input = {}) {
    return {
        pomodoros: clampInt(input.pomodoros, 0, 1000000, 0),
        rubs: clampInt(input.rubs, 0, 1000000, 0)
    };
}

function normalizeTimerState(input = {}, currentConfig = config) {
    const isStudyMode = typeof input.isStudyMode === 'boolean' ? input.isStudyMode : true;
    const defaultDuration = (isStudyMode ? currentConfig.studyDuration : currentConfig.breakDuration) * 60;
    const pausedRemaining = input.pausedRemaining == null
        ? null
        : clampInt(input.pausedRemaining, 0, 7200, defaultDuration);

    return {
        isStudyMode,
        isRunning: Boolean(input.isRunning),
        startTime: Number.isFinite(input.startTime) ? input.startTime : null,
        totalDuration: clampInt(input.totalDuration, 1, 7200, defaultDuration),
        pausedRemaining,
        currentRub: clampInt(input.currentRub, 1, 240, 1)
    };
}

// ===== State =====
let config = normalizeConfig();
let timerState = normalizeTimerState();
let stats = normalizeStats();
let quranData  = null;
let displayInterval = null;
let alarmAudio = null;
let alarmPrimed = false;

// ===== DOM Helpers =====
const $ = id => document.getElementById(id);

// ===== Surah Names =====
const surahNames = [
    "الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس",
    "هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه",
    "الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم",
    "لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر",
    "فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق",
    "الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة",
    "الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج",
    "نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس",
    "التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد",
    "الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات",
    "القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر",
    "المسد","الإخلاص","الفلق","الناس"
];

// ===== Init =====
async function init() {
    // Load stored state
    const stored = await chrome.storage.local.get(['config', 'timerState', 'stats']);
    config = normalizeConfig(stored.config || {});
    stats = normalizeStats(stored.stats || {});
    timerState = normalizeTimerState(stored.timerState || {}, config);
    await chrome.storage.local.set({ config, timerState, stats });

    // Populate dropdowns
    buildSurahDropdown();
    buildRubDropdown();

    // Apply theme
    applyTheme();
    updateUI();
    startDisplayLoop();

    // If currently in break mode, show Quran
    if (!timerState.isStudyMode) {
        $('quran-display').classList.remove('hidden');
        fetchQuranContent();
    }

    // Listen for background messages (timer ended while popup was closed)
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === 'TIMER_ENDED') {
            timerState = normalizeTimerState(msg.state || {}, config);
            chrome.storage.local.get('stats').then(s => {
                if (s.stats) stats = normalizeStats(s.stats);
            });
            updateUI();
            playAlarm();
            if (!timerState.isStudyMode) {
                $('quran-display').classList.remove('hidden');
                fetchQuranContent();
            } else {
                $('quran-display').classList.add('hidden');
            }
        }
    });

    // Wire up buttons
    $('start-btn').addEventListener('click', startTimer);
    $('pause-btn').addEventListener('click', pauseTimer);
    $('reset-btn').addEventListener('click', resetTimer);
    $('skip-btn').addEventListener('click', skipSession);
    $('prev-btn').addEventListener('click', () => navigateQuran(-1));
    $('next-btn').addEventListener('click', () => navigateQuran(1));

    // Settings
    $('settings-btn').addEventListener('click', openSettings);
    $('close-settings-btn').addEventListener('click', () => $('settings-modal').classList.add('hidden'));
    $('settings-overlay').addEventListener('click', () => $('settings-modal').classList.add('hidden'));
    $('save-settings-btn').addEventListener('click', saveSettings);
    $('reading-mode').addEventListener('change', e => updateModeVisibility(e.target.value));

    // Stats
    $('stats-btn').addEventListener('click', () => { updateStatsDisplay(); $('stats-modal').classList.remove('hidden'); });
    $('close-stats-btn').addEventListener('click', () => $('stats-modal').classList.add('hidden'));
    $('stats-overlay').addEventListener('click', () => $('stats-modal').classList.add('hidden'));
    $('reset-stats-btn').addEventListener('click', () => {
        stats = normalizeStats();
        chrome.storage.local.set({ stats });
        updateStatsDisplay();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        if (e.code === 'Space') { e.preventDefault(); timerState.isRunning ? pauseTimer() : startTimer(); }
        if (e.key === 'r' || e.key === 'R') resetTimer();
        if (e.key === 's' || e.key === 'S') skipSession();
        if (e.key === 'Escape') {
            $('settings-modal').classList.add('hidden');
            $('stats-modal').classList.add('hidden');
        }
    });
}

// ===== Timer Core =====
function getRemaining() {
    if (!timerState.isRunning) {
        return timerState.pausedRemaining ?? timerState.totalDuration;
    }
    const startTime = Number.isFinite(timerState.startTime) ? timerState.startTime : Date.now();
    const elapsed = (Date.now() - startTime) / 1000;
    return Math.max(0, timerState.totalDuration - elapsed);
}

function startDisplayLoop() {
    if (displayInterval) clearInterval(displayInterval);
    displayInterval = setInterval(() => {
        const rem = getRemaining();
        if (timerState.isRunning && rem <= 0) {
            // Popup open when timer hits 0 — alarm will fire from background
            updateTimerDisplay(0);
        } else {
            updateTimerDisplay(rem);
        }
    }, 500);
}

function updateTimerDisplay(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const str = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    $('time-left').textContent = str;
    document.title = `${str} — ${timerState.isStudyMode ? 'تركيز' : 'قرآن'} | بومودورو قرآني`;
    // Progress ring
    const fraction = timerState.totalDuration > 0 ? seconds / timerState.totalDuration : 0;
    const offset = CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, fraction)));
    const ring = $('timer-progress');
    if (ring) ring.style.strokeDashoffset = offset;
}

function updateUI() {
    const rem = getRemaining();
    updateTimerDisplay(rem);

    const isStudy = timerState.isStudyMode;
    document.body.classList.toggle('mode-study', isStudy);
    document.body.classList.toggle('mode-break', !isStudy);

    $('mode-title').textContent    = isStudy ? 'وقت التركيز' : 'استراحة قرآنية';
    $('mode-subtitle').textContent = isStudy ? `${config.studyDuration} دقيقة عمل عميق` : 'جدد روحك بقراءة القرآن';

    if (timerState.isRunning) {
        $('start-btn').classList.add('hidden');
        $('pause-btn').classList.remove('hidden');
    } else {
        $('start-btn').classList.remove('hidden');
        $('pause-btn').classList.add('hidden');
    }

    updateStatsDisplay();
}

function updateStatsDisplay() {
    $('stat-pomodoros').textContent = stats.pomodoros;
    $('stat-rubs').textContent      = stats.rubs;
}

function getAlarmAudio() {
    if (!alarmAudio) {
        alarmAudio = new Audio(chrome.runtime.getURL('alarm.m4a'));
        alarmAudio.preload = 'auto';
    }
    return alarmAudio;
}

async function primeAlarmAudio() {
    if (alarmPrimed) return;

    try {
        const audio = getAlarmAudio();
        audio.muted = true;
        await audio.play();
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
        alarmPrimed = true;
    } catch {
        if (alarmAudio) alarmAudio.muted = false;
    }
}

// ===== Timer Controls =====
function startTimer() {
    if (timerState.isRunning) return;
    primeAlarmAudio();
    const remaining = timerState.pausedRemaining ?? timerState.totalDuration;
    timerState.isRunning       = true;
    timerState.startTime       = Date.now();
    timerState.totalDuration   = remaining;
    timerState.pausedRemaining = null;

    chrome.alarms.clear('pomodoroEnd');
    chrome.alarms.create('pomodoroEnd', { when: Date.now() + remaining * 1000 });
    chrome.storage.local.set({ timerState, config });
    updateUI();
}

function pauseTimer() {
    if (!timerState.isRunning) return;
    timerState.pausedRemaining = Math.max(0, getRemaining());
    timerState.isRunning       = false;
    timerState.startTime       = null;
    chrome.alarms.clear('pomodoroEnd');
    chrome.storage.local.set({ timerState });
    updateUI();
}

function resetTimer() {
    chrome.alarms.clear('pomodoroEnd');
    timerState.isRunning       = false;
    timerState.startTime       = null;
    timerState.totalDuration   = (timerState.isStudyMode ? config.studyDuration : config.breakDuration) * 60;
    timerState.pausedRemaining = null;
    chrome.storage.local.set({ timerState });
    updateUI();
}

function skipSession() {
    chrome.alarms.clear('pomodoroEnd');
    const wasStudy = timerState.isStudyMode;

    if (wasStudy) {
        // Study -> break
        stats.pomodoros += 1;
    } else {
        // Break -> study: advance rub
        stats.rubs += config.rubCount;
        timerState.currentRub = ((timerState.currentRub - 1 + config.rubCount) % 240) + 1;
    }

    timerState.isStudyMode     = !wasStudy;
    timerState.isRunning       = false;
    timerState.startTime       = null;
    timerState.totalDuration   = timerState.isStudyMode ? config.studyDuration * 60 : config.breakDuration * 60;
    timerState.pausedRemaining = null;

    chrome.storage.local.set({ timerState, stats });
    playAlarm();

    if (!timerState.isStudyMode) {
        $('quran-display').classList.remove('hidden');
        fetchQuranContent();
    } else {
        $('quran-display').classList.add('hidden');
    }
    updateUI();
}

// ===== Quran Data =====
async function loadQuranData() {
    if (quranData) return quranData;
    const url = chrome.runtime.getURL('quran_offline.json');
    const res  = await fetch(url);
    quranData  = await res.json();
    return quranData;
}

function toArabicNum(n) {
    return String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

function buildVersesHtml(verses) {
    if (!verses || verses.length === 0) return '<div class="error-msg">لا توجد آيات</div>';
    let html = '<div class="mushaf-layout">';
    verses.forEach(v => {
        html += `<span class="ayah-container"><span class="ayah-text">${v.text_uthmani}</span><span class="ayah-number">${toArabicNum(v.verse_number)}</span></span>`;
    });
    html += '</div>';
    return html;
}

async function fetchQuranContent() {
    const container = $('verses-container');
    const loader    = $('quran-loader');
    container.innerHTML = '';
    loader.classList.remove('hidden');

    try {
        const data = await loadQuranData();

        if (config.readingMode === 'challenge') {
            container.classList.remove('mushaf-page-style');
            const allVerses = data.chapters[String(config.challengeSurah || 18)] || [];
            const perPage   = (config.rubCount || 1) * 15;
            const page      = config.challengePage || 1;
            const start     = (page - 1) * perPage;
            const sliced    = allVerses.slice(start, start + perPage);
            const hasNext   = (start + perPage) < allVerses.length;

            $('hizb-number').textContent = `تحدي: ${surahNames[(config.challengeSurah || 18) - 1]} — صفحة ${page}`;
            container.innerHTML = buildVersesHtml(sliced);
            if (!hasNext) $('hizb-number').textContent += ' — 🎉 اكتملت!';
            // Store page position but don't auto-advance (user navigates manually)
            chrome.storage.local.set({ config });

        } else if (config.readingMode === 'page') {
            container.classList.add('mushaf-page-style');
            const pg = config.mushafPage || 1;
            const verses = data.pages[String(pg)] || [];
            $('hizb-number').textContent = `صفحة المصحف: ${pg}`;
            container.innerHTML = buildVersesHtml(verses);
            chrome.storage.local.set({ config });

        } else {
            // Rub mode
            container.classList.remove('mushaf-page-style');
            const rubNum = timerState.currentRub || 1;
            const count  = config.rubCount || 1;
            let allVerses = [];
            for (let i = 0; i < count; i++) {
                const r = ((rubNum - 1 + i) % 240) + 1;
                allVerses = allVerses.concat(data.rubs[String(r)] || []);
            }
            const endRub = ((rubNum - 1 + count - 1) % 240) + 1;
            $('hizb-number').textContent = count > 1
                ? `ربع الحزب: ${rubNum} - ${endRub}`
                : `ربع الحزب: ${rubNum}`;
            container.innerHTML = buildVersesHtml(allVerses);
        }
    } catch (err) {
        console.error('Quran load error:', err);
        container.innerHTML = '<div class="error-msg">حدث خطأ في تحميل الآيات</div>';
    }

    loader.classList.add('hidden');
    // Scroll to top
    container.scrollTop = 0;
}

// ===== Navigation =====
async function navigateQuran(direction) {
    if (config.readingMode === 'page') {
        let target = (config.mushafPage || 1) + direction;
        if (target < 1) target = 604;
        if (target > 604) target = 1;
        config.mushafPage = target;

    } else if (config.readingMode === 'challenge') {
        const next = (config.challengePage || 1) + direction;
        if (next < 1) return;
        config.challengePage = next;

    } else {
        // Rub mode
        const count = config.rubCount || 1;
        if (direction === 1) {
            timerState.currentRub = ((timerState.currentRub - 1 + count) % 240) + 1;
        } else {
            timerState.currentRub = ((timerState.currentRub - 1 - count + 240 * 10) % 240) + 1;
        }
        chrome.storage.local.set({ timerState });
    }
    await fetchQuranContent();
}

// ===== Audio =====
function playAlarm() {
    try {
        const audio = getAlarmAudio();
        audio.currentTime = 0;
        audio.play().catch(() => {});
    } catch (e) {}
}

// ===== Theme =====
function applyTheme() {
    document.body.classList.remove('theme-mint','theme-dark','theme-lavender','theme-sky','theme-rose','theme-sand');
    document.body.classList.add(`theme-${config.theme || 'mint'}`);
    document.documentElement.style.setProperty('--quran-font-size', config.fontSize || '1.9rem');
}

// ===== Settings =====
function buildSurahDropdown() {
    const sel = $('challenge-surah');
    surahNames.forEach((name, i) => {
        const opt = document.createElement('option');
        opt.value = i + 1;
        opt.textContent = `${i + 1}. ${name}`;
        sel.appendChild(opt);
    });
}

function buildRubDropdown() {
    const sel = $('current-rub');
    const juzStart = [1,2,2,3,4,4,5,6,7,8,9,11,12,15,17,18,21,23,25,27,29,33,36,39,41,46,51,58,67,78];
    const defOpt = document.createElement('option');
    defOpt.value = '';
    defOpt.textContent = '— الإبقاء على الحالي —';
    sel.appendChild(defOpt);
    for (let juz = 0; juz < 30; juz++) {
        const surahName = surahNames[juzStart[juz] - 1];
        const group = document.createElement('optgroup');
        group.label = `الجزء ${juz + 1} — ${surahName}`;
        for (let r = 0; r < 8; r++) {
            const rubNum = juz * 8 + r + 1;
            const hizbNum = Math.ceil(rubNum / 4);
            const qLabel = ['الأول','الثاني','الثالث','الرابع'][((rubNum - 1) % 4)];
            const opt = document.createElement('option');
            opt.value = rubNum;
            opt.textContent = `ربع ${rubNum} — الحزب ${hizbNum} (${qLabel})`;
            group.appendChild(opt);
        }
        sel.appendChild(group);
    }
}

function updateModeVisibility(mode) {
    $('rub-group').classList.toggle('hidden',     mode !== 'rub');
    $('surah-group').classList.toggle('hidden',   mode !== 'challenge');
    $('page-group').classList.toggle('hidden',    mode !== 'page');
}

function openSettings() {
    $('study-duration').value       = config.studyDuration;
    $('break-duration').value       = config.breakDuration;
    $('rub-count').value            = config.rubCount;
    $('theme-select').value         = config.theme || 'mint';
    $('font-size').value            = config.fontSize || '1.9rem';
    $('reading-mode').value         = config.readingMode || 'rub';
    $('challenge-surah').value      = config.challengeSurah || 18;
    $('current-rub').value          = '';
    $('current-page').value         = '';
    updateModeVisibility(config.readingMode || 'rub');
    $('settings-modal').classList.remove('hidden');
}

async function saveSettings() {
    config.studyDuration  = clampInt($('study-duration').value, 1, 120, 30);
    config.breakDuration  = clampInt($('break-duration').value, 1, 60, 15);
    config.rubCount       = clampInt($('rub-count').value, 1, 8, 1);
    config.theme          = THEMES.has($('theme-select').value) ? $('theme-select').value : 'mint';
    config.fontSize       = FONT_SIZES.has($('font-size').value) ? $('font-size').value : '1.9rem';

    const mode = READING_MODES.has($('reading-mode').value) ? $('reading-mode').value : 'rub';
    config.readingMode = mode;

    if (mode === 'challenge') {
        const newSurah = clampInt($('challenge-surah').value, 1, 114, 18);
        if (config.challengeSurah !== newSurah) config.challengePage = 1;
        config.challengeSurah = newSurah;
    } else if (mode === 'page') {
        const pg = readOptionalInt($('current-page').value, 1, 604);
        if (pg !== null) config.mushafPage = pg;
    } else {
        const newRub = readOptionalInt($('current-rub').value, 1, 240);
        if (newRub !== null) timerState.currentRub = newRub;
    }

    // Reset timer durations
    if (!timerState.isRunning) {
        timerState.totalDuration   = (timerState.isStudyMode ? config.studyDuration : config.breakDuration) * 60;
        timerState.pausedRemaining = null;
    }

    await chrome.storage.local.set({ config, timerState });
    applyTheme();
    updateUI();

    if (!timerState.isStudyMode) fetchQuranContent();
    $('settings-modal').classList.add('hidden');
}

// ===== Start =====
init();
