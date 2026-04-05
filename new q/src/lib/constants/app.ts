import type {
  AppSettings,
  AppStats,
  FocusQuote,
  ReaderProgressState,
  MushafLineWidthMode,
  MushafZoomMode,
  ThemeName
} from "@/lib/types/app";
import type { ReadingMode, SessionPhase } from "@/lib/types/quran";

export const THEMES: ThemeName[] = ["mint", "pitch"];

export const READING_MODES: ReadingMode[] = ["rub", "page"];

export const SESSION_PHASES: SessionPhase[] = ["study", "break"];

export const QURAN_FONT_SIZES = ["1.8rem", "2rem", "2.3rem", "2.6rem", "2.9rem", "3.2rem"] as const;
export const RUB_PAGE_SPREAD_COUNTS = [1, 2] as const;
export const MUSHAF_PAGE_DISPLAY_COUNTS = [1, 2, 3] as const;
export const MUSHAF_ZOOM_MODES: MushafZoomMode[] = ["stepped", "smooth", "quranFontSize"];
export const MUSHAF_LINE_WIDTH_MODES: MushafLineWidthMode[] = ["scale", "fixed"];

export const QURAN_FONT_LABELS: Record<(typeof QURAN_FONT_SIZES)[number], string> = {
  "1.8rem": "مريح",
  "2rem": "متوسط",
  "2.3rem": "مريح+",
  "2.6rem": "كبير",
  "2.9rem": "كبير+",
  "3.2rem": "واسع"
};

export const MUSHAF_ZOOM_MODE_LABELS: Record<MushafZoomMode, string> = {
  stepped: "متدرج",
  smooth: "سلس",
  quranFontSize: "quranFontSize"
};

export const MUSHAF_LINE_WIDTH_MODE_LABELS: Record<MushafLineWidthMode, string> = {
  scale: "يتسع مع الخط",
  fixed: "ثابت"
};

export const TAFSIR_FONT_SIZES = ["0.95rem", "1.05rem", "1.2rem", "1.35rem", "1.5rem"] as const;

export const TAFSIR_IDS = [925, 91, 93, 94, 14, 15, 16, 90] as const;

export const TAFSIR_ENHANCE_PROVIDERS = ["auto", "google", "groq"] as const;

export const TAFSIR_OPTIONS = [
  { id: 925, label: "Arabic Tanweer Tafseer" },
  { id: 91, label: "السعدي" },
  { id: 93, label: "التفسير الوسيط" },
  { id: 94, label: "تفسير البغوي" },
  { id: 14, label: "تفسير ابن كثير" },
  { id: 15, label: "تفسير الطبري" },
  { id: 16, label: "التفسير الميسر" },
  { id: 90, label: "القرطبي" }
] as const;

export const SURAH_NAMES = [
  "الفاتحة",
  "البقرة",
  "آل عمران",
  "النساء",
  "المائدة",
  "الأنعام",
  "الأعراف",
  "الأنفال",
  "التوبة",
  "يونس",
  "هود",
  "يوسف",
  "الرعد",
  "إبراهيم",
  "الحجر",
  "النحل",
  "الإسراء",
  "الكهف",
  "مريم",
  "طه",
  "الأنبياء",
  "الحج",
  "المؤمنون",
  "النور",
  "الفرقان",
  "الشعراء",
  "النمل",
  "القصص",
  "العنكبوت",
  "الروم",
  "لقمان",
  "السجدة",
  "الأحزاب",
  "سبأ",
  "فاطر",
  "يس",
  "الصافات",
  "ص",
  "الزمر",
  "غافر",
  "فصلت",
  "الشورى",
  "الزخرف",
  "الدخان",
  "الجاثية",
  "الأحقاف",
  "محمد",
  "الفتح",
  "الحجرات",
  "ق",
  "الذاريات",
  "الطور",
  "النجم",
  "القمر",
  "الرحمن",
  "الواقعة",
  "الحديد",
  "المجادلة",
  "الحشر",
  "الممتحنة",
  "الصف",
  "الجمعة",
  "المنافقون",
  "التغابن",
  "الطلاق",
  "التحريم",
  "الملك",
  "القلم",
  "الحاقة",
  "المعارج",
  "نوح",
  "الجن",
  "المزمل",
  "المدثر",
  "القيامة",
  "الإنسان",
  "المرسلات",
  "النبأ",
  "النازعات",
  "عبس",
  "التكوير",
  "الانفطار",
  "المطففين",
  "الانشقاق",
  "البروج",
  "الطارق",
  "الأعلى",
  "الغاشية",
  "الفجر",
  "البلد",
  "الشمس",
  "الليل",
  "الضحى",
  "الشرح",
  "التين",
  "العلق",
  "القدر",
  "البينة",
  "الزلزلة",
  "العاديات",
  "القارعة",
  "التكاثر",
  "العصر",
  "الهمزة",
  "الفيل",
  "قريش",
  "الماعون",
  "الكوثر",
  "الكافرون",
  "النصر",
  "المسد",
  "الإخلاص",
  "الفلق",
  "الناس"
] as const;

/** Mushaf page where each surah begins (Madani Mushaf, 1-indexed by surah number). */
export const SURAH_START_PAGES: readonly number[] = [
  1, 2, 50, 77, 106, 128, 151, 177, 187, 208,
  221, 235, 249, 255, 262, 267, 282, 293, 305, 312,
  322, 332, 342, 350, 359, 367, 377, 385, 396, 404,
  411, 415, 418, 428, 434, 440, 446, 453, 458, 467,
  477, 483, 489, 496, 499, 502, 507, 511, 515, 518,
  520, 523, 526, 528, 531, 534, 537, 542, 545, 549,
  551, 553, 554, 556, 558, 560, 562, 564, 566, 568,
  570, 572, 574, 575, 577, 578, 580, 582, 583, 585,
  586, 587, 587, 589, 590, 591, 591, 592, 593, 594,
  595, 595, 596, 596, 597, 597, 598, 598, 599, 599,
  600, 600, 601, 601, 601, 602, 602, 602, 603, 603,
  603, 604, 604, 604
];

export const DEFAULT_SETTINGS: AppSettings = {
  studyDuration: 10,
  breakDuration: 15,
  dailyGoalHours: 4,
  rubCount: 1,
  rubPageSpreadCount: 1,
  mushafPageDisplayCount: 1,
  mushafZoomMode: "smooth",
  mushafLineWidthMode: "scale",
  theme: "mint",
  readingMode: "rub",
  tafsirId: 16,
  tafsirEnhanceProvider: "auto",
  tafsirHighlightColor: "#ef4444",
  recitationId: 7,
  verseAudioOnClick: true,
  challengeSurah: 18,
  quranFontSize: "2.3rem",
  tafsirFontSize: "1.05rem"
};

export const DEFAULT_STATS: AppStats = {
  pomodoros: 0,
  rubs: 0,
  pages: 0
};

export const DEFAULT_READER_STATE: ReaderProgressState = {
  currentRub: 1,
  challengePage: 1,
  mushafPage: 1,
  lastReaderRoute: "/reader/rub"
};

export const FOCUS_QUOTES: FocusQuote[] = [
  {
    text: "نحن قوم أعزنا الله بالإسلام، فمهما ابتغينا العزة بغيره أذلنا الله.",
    source: "عمر بن الخطاب رضي الله عنه",
    kind: "مقولة"
  },
  {
    text: "لا تُصَغِّرَنَّ همتكم؛ فإني لم أرَ أقعدَ عن المكرمات من صِغَر الهمم.",
    source: "عمر بن الخطاب رضي الله عنه",
    kind: "مقولة"
  },
  {
    text: "إني لأكره أن أرى أحدكم سَبَهْلَلًا، لا في عمل دنيا ولا في عمل آخرة.",
    source: "عمر بن الخطاب رضي الله عنه",
    kind: "مقولة"
  },
  {
    text: "ما ندمتُ على شيءٍ ندمي على يومٍ غربت شمسه، نقص فيه أجلي، ولم يزد فيه عملي.",
    source: "عبد الله بن مسعود رضي الله عنه",
    kind: "مقولة"
  },
  {
    text: "قيمةُ كلِّ امرئٍ ما يُحسِن.",
    source: "علي بن أبي طالب رضي الله عنه",
    kind: "مقولة"
  },
  {
    text: "من نصب نفسه للناس إمامًا فعليه أن يبدأ بتعليم نفسه قبل تعليم غيره، وليكن تأديبه بسيرته قبل تأديبه بلسانه.",
    source: "علي بن أبي طالب رضي الله عنه",
    kind: "مقولة"
  },
  {
    text: "بين كل مهمة ومهمة… لقاء مع القرآن",
    source: "غير منسوب",
    kind: "مقولة"
  },
  {
    text: "وقت تنجز فيه، ووقت ترتاح فيه مع القرآن",
    source: "غير منسوب",
    kind: "مقولة"
  },
  {
    text: "اجعل بين أعمالك وردًا ينعش قلبك",
    source: "غير منسوب",
    kind: "مقولة"
  },
  {
    text: "أنجز ما عليك، واهدأ بما يُطمئنك",
    source: "غير منسوب",
    kind: "مقولة"
  },
  {
    text: "بين ضغط اليوم وسكينته… قرآن",
    source: "غير منسوب",
    kind: "مقولة"
  },
  {
    text: "لحظات تركيز، تتبعها لحظات نور",
    source: "غير منسوب",
    kind: "مقولة"
  },
  {
    text: "وقت للعمل، ووقت يزهر فيه القلب بالقرآن",
    source: "غير منسوب",
    kind: "مقولة"
  },
  {
    text: "مع كل إنجاز… استراحة لها معنى",
    source: "غير منسوب",
    kind: "مقولة"
  },
  {
    text: "أنجز لدنياك، واسترح بما يقرّبك",
    source: "غير منسوب",
    kind: "مقولة"
  },
  {
    text: "اجعل راحتك أقرب إلى الطمأنينة",
    source: "غير منسوب",
    kind: "مقولة"
  },
  {
    text: "لأن الراحة الحقيقية… آيات",
    source: "غير منسوب",
    kind: "مقولة"
  },
  {
    text: "بين انشغال اليوم وهدوء الروح… قرآن",
    source: "غير منسوب",
    kind: "مقولة"
  },
  {
    text: "استراحة قصيرة… وأثرها طويل",
    source: "غير منسوب",
    kind: "مقولة"
  },
  {
    text: "وقتك منظم، وروحك أقرب",
    source: "غير منسوب",
    kind: "مقولة"
  },
  {
    text: "أنجز أكثر، واقترب أكثر",
    source: "غير منسوب",
    kind: "مقولة"
  },
  {
    text: "كل إنجاز يتبعه نور",
    source: "غير منسوب",
    kind: "مقولة"
  },
  {
    text: "رتّب يومك… وزيّن فواصلَه بالقرآن",
    source: "غير منسوب",
    kind: "مقولة"
  },
  {
    text: "من التركيز إلى السكينة… بخطوة واحدة",
    source: "غير منسوب",
    kind: "مقولة"
  },
  {
    text: "اجعل فترات راحتك عامرة بالقرآن",
    source: "غير منسوب",
    kind: "مقولة"
  },
  {
    text: "بين السعي والسكينة… ورد",
    source: "غير منسوب",
    kind: "مقولة"
  }
];

export const NAV_ITEMS = [
  { href: "/", label: "الرئيسية" },
  { href: "/focus", label: "التركيز" },
  { href: "/reader/rub", label: "القراءة" },
  { href: "/stats", label: "الإحصاءات" },
  { href: "/settings", label: "الإعدادات" }
] as const;