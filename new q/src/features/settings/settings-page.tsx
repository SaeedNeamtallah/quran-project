"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  DEFAULT_SETTINGS,
  MUSHAF_LINE_WIDTH_MODE_LABELS,
  MUSHAF_LINE_WIDTH_MODES,
  MUSHAF_PAGE_DISPLAY_COUNTS,
  MUSHAF_ZOOM_MODE_LABELS,
  MUSHAF_ZOOM_MODES,
  QURAN_FONT_LABELS,
  QURAN_FONT_SIZES,
  RUB_PAGE_SPREAD_COUNTS,
  SURAH_NAMES,
  TAFSIR_ENHANCE_PROVIDERS,
  TAFSIR_FONT_SIZES,
  TAFSIR_OPTIONS,
  THEMES
} from "@/lib/constants/app";
import { fetchRecitations, fetchOfflineQuranData } from "@/lib/api/client";
import { getAppStatusQueryOptions } from "@/lib/api/app-status-query";
import { useReaderStore } from "@/lib/stores/reader-store";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useTimerStore } from "@/lib/stores/timer-store";

export function SettingsPage() {
  const settings = useSettingsStore(useShallow((state) => ({
    studyDuration: state.studyDuration,
    breakDuration: state.breakDuration,
    rubCount: state.rubCount,
    rubPageSpreadCount: state.rubPageSpreadCount,
    mushafPageDisplayCount: state.mushafPageDisplayCount,
    mushafZoomMode: state.mushafZoomMode,
    mushafLineWidthMode: state.mushafLineWidthMode,
    theme: state.theme,
    readingMode: state.readingMode,
    tafsirId: state.tafsirId,
    tafsirEnhanceProvider: state.tafsirEnhanceProvider,
    tafsirHighlightColor: state.tafsirHighlightColor,
    recitationId: state.recitationId,
    verseAudioOnClick: state.verseAudioOnClick,
    quranFontSize: state.quranFontSize,
    tafsirFontSize: state.tafsirFontSize
  })));
  const patchSettings = useSettingsStore((state) => state.patchSettings);
  const resetSettings = useSettingsStore((state) => state.resetSettings);
  const phase = useTimerStore((state) => state.phase);
  const resetTimer = useTimerStore((state) => state.reset);
  const currentRub = useReaderStore((state) => state.currentRub);
  const mushafPage = useReaderStore((state) => state.mushafPage);

  const [form, setForm] = useState(settings);
  const [readerPosition, setReaderPosition] = useState({ currentRub, mushafPage });
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const statusQuery = useQuery(getAppStatusQueryOptions());
  const backendAvailable = Boolean(statusQuery.data?.backendAvailable);

  const offlineQuery = useQuery({
    queryKey: ["offline-quran", backendAvailable],
    queryFn: fetchOfflineQuranData
  });

  const [selectedSurah, setSelectedSurah] = useState<number>(1);

  const availableRubs = useMemo(() => {
    if (!offlineQuery.data?.chapters) return [];
    const verses = offlineQuery.data.chapters[String(selectedSurah)] || [];
    const rubs = Array.from(new Set(verses.map((v) => v.rub_el_hizb_number))).filter(Boolean);
    return rubs.sort((a, b) => a - b);
  }, [offlineQuery.data, selectedSurah]);

  const availablePages = useMemo(() => {
    if (!offlineQuery.data?.chapters) return [];
    const verses = offlineQuery.data.chapters[String(selectedSurah)] || [];
    const pages = Array.from(new Set(verses.map((v) => v.page_number))).filter(Boolean);
    return pages.sort((a, b) => a - b);
  }, [offlineQuery.data, selectedSurah]);

  const recitationsQuery = useQuery({
    queryKey: ["recitations", backendAvailable],
    queryFn: fetchRecitations,
    enabled: backendAvailable
  });

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  useEffect(() => {
    setReaderPosition({ currentRub, mushafPage });
  }, [currentRub, mushafPage]);

  useEffect(() => {
    if (!saveNotice) return;
    const timeoutId = window.setTimeout(() => setSaveNotice(null), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [saveNotice]);

  // Synchronize Surah selector initially based on active position
  useEffect(() => {
    if (!offlineQuery.data?.chapters) return;
    for (const [chapterId, verses] of Object.entries(offlineQuery.data.chapters)) {
      if (form.readingMode === "page") {
        if (verses.some((v) => v.page_number === readerPosition.mushafPage)) {
          setSelectedSurah(Number(chapterId));
          return;
        }
      } else {
        if (verses.some((v) => v.rub_el_hizb_number === readerPosition.currentRub)) {
          setSelectedSurah(Number(chapterId));
          return;
        }
      }
    }
  }, [offlineQuery.data, form.readingMode]);

  const themeOptions = useMemo(
    () =>
      [
        { value: "mint", label: "نعناعي" },
        { value: "pitch", label: "داكن جداً" }
      ].filter((option) => THEMES.includes(option.value as (typeof THEMES)[number])),
    []
  );

  const recitationOptions = useMemo(() => {
    const options = recitationsQuery.data?.recitations ?? [];
    if (!options.length) {
      return [
        {
          id: form.recitationId,
          label: `القارئ ${form.recitationId}`
        }
      ];
    }

    if (options.some((option) => option.id === form.recitationId)) {
      return options;
    }

    return [
      {
        id: form.recitationId,
        label: `القارئ ${form.recitationId}`
      },
      ...options
    ];
  }, [form.recitationId, recitationsQuery.data?.recitations]);

  function updateField<Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  function handleSave() {
    const noFormChanges = JSON.stringify(form) === JSON.stringify(settings);
    const noReaderChanges = readerPosition.currentRub === currentRub && readerPosition.mushafPage === mushafPage;

    if (noFormChanges && noReaderChanges) {
      setSaveNotice("لا توجد تغييرات جديدة للحفظ.");
      return;
    }

    patchSettings(form);
    const readerStore = useReaderStore.getState();
    readerStore.setCurrentRub(readerPosition.currentRub);
    readerStore.setMushafPage(readerPosition.mushafPage);
    resetTimer({
      studySeconds: form.studyDuration * 60,
      breakSeconds: form.breakDuration * 60
    });
    setSaveNotice("تم الحفظ.");
  }

  function handleResetDefaults() {
    setForm({
      studyDuration: DEFAULT_SETTINGS.studyDuration,
      breakDuration: DEFAULT_SETTINGS.breakDuration,
      rubCount: DEFAULT_SETTINGS.rubCount,
      rubPageSpreadCount: DEFAULT_SETTINGS.rubPageSpreadCount,
      mushafPageDisplayCount: DEFAULT_SETTINGS.mushafPageDisplayCount,
      mushafZoomMode: DEFAULT_SETTINGS.mushafZoomMode,
      mushafLineWidthMode: DEFAULT_SETTINGS.mushafLineWidthMode,
      theme: DEFAULT_SETTINGS.theme,
      readingMode: DEFAULT_SETTINGS.readingMode,
      tafsirId: DEFAULT_SETTINGS.tafsirId,
      tafsirEnhanceProvider: DEFAULT_SETTINGS.tafsirEnhanceProvider,
      tafsirHighlightColor: DEFAULT_SETTINGS.tafsirHighlightColor,
      recitationId: DEFAULT_SETTINGS.recitationId,
      verseAudioOnClick: DEFAULT_SETTINGS.verseAudioOnClick,
      quranFontSize: DEFAULT_SETTINGS.quranFontSize,
      tafsirFontSize: DEFAULT_SETTINGS.tafsirFontSize
    });
    resetSettings();
    setReaderPosition({ currentRub: 1, mushafPage: 1 });
    const readerStore = useReaderStore.getState();
    readerStore.setCurrentRub(1);
    readerStore.setMushafPage(1);
    resetTimer({
      studySeconds: DEFAULT_SETTINGS.studyDuration * 60,
      breakSeconds: DEFAULT_SETTINGS.breakDuration * 60
    });
    setSaveNotice("تمت استعادة الإعدادات الافتراضية.");
  }

  const fieldLabelClass = "grid gap-1.5 text-xs font-medium text-ink sm:text-sm";
  const fieldControlClass = "rounded-xl border border-line bg-surface/75 px-3 py-2 text-sm text-ink outline-none ring-0";
  const fieldControlWithFocusClass = `${fieldControlClass} focus:border-accent`;

  return (
    <div className="grid gap-5">
      <section className="glass-panel rounded-[1.5rem] px-5 py-6 sm:px-6">
        <div className="grid gap-3">
          <span className="text-xs font-semibold text-accent sm:text-sm">إعدادات الجلسة</span>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">كل ما يلزم لضبط التجربة الجديدة في مكان واحد.</h1>
          <p className="max-w-3xl text-sm leading-7 text-muted">
            هذه الصفحة تضبط المؤقت والقراءة والتفسير والثيمات. القارئ يدعم الآن <strong>الأرباع المتتالية</strong> و<strong>صفحة المصحف</strong>، مع بقاء الوضع الحالي للمؤقت: {phase === "study" ? "تركيز" : "استراحة قراءة"}.
          </p>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="glass-panel rounded-[1.5rem] p-5">
          <h2 className="text-lg font-semibold text-ink">الإيقاع العام</h2>
          <div className="mt-4 grid gap-3.5">
            <label className={fieldLabelClass}>
              مدة التركيز
              <input
                type="number"
                min={1}
                max={120}
                value={form.studyDuration}
                onChange={(event) => updateField("studyDuration", Number(event.target.value))}
                className={fieldControlClass}
              />
            </label>
            <label className={fieldLabelClass}>
              مدة استراحة القرآن
              <input
                type="number"
                min={1}
                max={60}
                value={form.breakDuration}
                onChange={(event) => updateField("breakDuration", Number(event.target.value))}
                className={fieldControlClass}
              />
            </label>
            <label className={fieldLabelClass}>
              عدد الأرباع
              <input
                type="number"
                min={1}
                max={8}
                value={form.rubCount}
                onChange={(event) => updateField("rubCount", Number(event.target.value))}
                className={fieldControlClass}
              />
            </label>

            <label className={fieldLabelClass}>
              عرض صفحات الربع في السطر
              <select
                value={form.rubPageSpreadCount}
                onChange={(event) => updateField("rubPageSpreadCount", Number(event.target.value))}
                className={fieldControlClass}
              >
                {RUB_PAGE_SPREAD_COUNTS.map((count) => (
                  <option key={count} value={count}>
                    {count === 1 ? "صفحة واحدة" : "صفحتان"}
                  </option>
                ))}
              </select>
            </label>
            <label className={fieldLabelClass}>
              عدد الصفحات في وضع الصفحة
              <select
                value={form.mushafPageDisplayCount}
                onChange={(event) => updateField("mushafPageDisplayCount", Number(event.target.value))}
                className={fieldControlClass}
              >
                {MUSHAF_PAGE_DISPLAY_COUNTS.map((count) => (
                  <option key={count} value={count}>
                    {count} {count === 1 ? "صفحة" : "صفحات"}
                  </option>
                ))}
              </select>
            </label>


          </div>
        </section>

        <section className="glass-panel rounded-[1.5rem] p-5">
          <h2 className="text-lg font-semibold text-ink">القراءة والتفسير والمظهر</h2>
          <p className="mt-2.5 text-xs leading-6 text-muted sm:text-sm sm:leading-7">
            {backendAvailable
              ? "خيارات التلاوة متصلة الآن بالسيرفر المحلي ويمكن تغيير القارئ من هذه الصفحة."
              : "السيرفر المحلي غير متاح حاليًا، لذلك ستبقى خيارات التلاوة للعرض فقط حتى يعود الاتصال."}
          </p>
          <div className="mt-4 grid gap-3.5">
            <label className={fieldLabelClass}>
              الثيم
              <select
                value={form.theme}
                onChange={(event) => updateField("theme", event.target.value as typeof form.theme)}
                className={fieldControlClass}
              >
                {themeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={fieldLabelClass}>
              حجم خط القرآن
              <select
                value={form.quranFontSize}
                onChange={(event) => updateField("quranFontSize", event.target.value)}
                className={fieldControlClass}
              >
                {QURAN_FONT_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {QURAN_FONT_LABELS[size]}
                  </option>
                ))}
              </select>
            </label>
            <label className={fieldLabelClass}>
              حجم خط التفسير
              <select
                value={form.tafsirFontSize}
                onChange={(event) => updateField("tafsirFontSize", event.target.value)}
                className={fieldControlClass}
              >
                {TAFSIR_FONT_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <label className={fieldLabelClass}>
              التفسير
              <select
                value={form.tafsirId}
                onChange={(event) => updateField("tafsirId", Number(event.target.value))}
                className={fieldControlClass}
              >
                {TAFSIR_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={fieldLabelClass}>
              لون إبراز الأقواس () و {}
              <input
                type="color"
                value={form.tafsirHighlightColor}
                onChange={(event) => updateField("tafsirHighlightColor", event.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface/75 p-1.5"
              />
            </label>
            <label className={fieldLabelClass}>
              القارئ
              <select
                value={form.recitationId}
                disabled={!backendAvailable || recitationsQuery.isLoading}
                onChange={(event) => updateField("recitationId", Number(event.target.value))}
                className={`${fieldControlClass} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {recitationOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface/75 px-3 py-3 text-xs font-medium text-ink sm:text-sm">
              <span>تشغيل صوت الآية عند الضغط</span>
              <input
                type="checkbox"
                checked={form.verseAudioOnClick}
                onChange={(event) => updateField("verseAudioOnClick", event.target.checked)}
                className="h-4 w-4 accent-[rgb(var(--accent))] sm:h-5 sm:w-5"
              />
            </label>
          </div>
        </section>
      </div>

      <section className="glass-panel rounded-[1.5rem] p-5">
        <h2 className="text-lg font-semibold text-ink">موضع القراءة الحالي</h2>
        <p className="mt-2.5 text-xs leading-6 text-muted sm:text-sm sm:leading-7">
          خصّص المكان الذي ستبدأ منه جلسات القراءة. اختر السورة، ثم حدد رقم الصفحة أو الربع (بناءً على وضع القراءة الحالي).
        </p>

        <div className="mt-4 grid gap-3.5 sm:grid-cols-2 md:max-w-2xl">
          <label className={fieldLabelClass}>
            اختر السورة
            <div className="relative">
              <select
                data-testid="settings-current-surah"
                value={selectedSurah}
                onChange={(event) => {
                  const newSurah = Number(event.target.value);
                  setSelectedSurah(newSurah);
                  
                  // Auto-update the target page/rub when surah changes to the first valid hit
                  if (offlineQuery.data?.chapters) {
                    const verses = offlineQuery.data.chapters[String(newSurah)] || [];
                    if (form.readingMode === "page") {
                      const firstPage = verses.find((v) => v.page_number)?.page_number;
                      if (firstPage) setReaderPosition(prev => ({ ...prev, mushafPage: firstPage }));
                    } else {
                      const firstRub = verses.find((v) => v.rub_el_hizb_number)?.rub_el_hizb_number;
                      if (firstRub) setReaderPosition(prev => ({ ...prev, currentRub: firstRub }));
                    }
                  }
                }}
                className={`w-full appearance-none ${fieldControlWithFocusClass}`}
              >
                {SURAH_NAMES.map((name, index) => (
                  <option key={index + 1} value={index + 1}>
                    {index + 1}. سورة {name}
                  </option>
                ))}
              </select>
            </div>
          </label>

          {form.readingMode === "page" ? (
            <label className={fieldLabelClass}>
              الصفحة المختارة
              <div className="relative">
                <select
                  data-testid="settings-current-page"
                  value={readerPosition.mushafPage}
                  onChange={(event) => setReaderPosition(prev => ({ ...prev, mushafPage: Number(event.target.value) }))}
                  disabled={!availablePages.length}
                  className={`w-full appearance-none ${fieldControlWithFocusClass} disabled:opacity-50`}
                >
                  {availablePages.map((pageNum) => (
                    <option key={pageNum} value={pageNum}>
                      الصفحة {pageNum}
                    </option>
                  ))}
                  {/* Fallback if somehow empty but has a value */}
                  {!availablePages.includes(readerPosition.mushafPage) && (
                    <option value={readerPosition.mushafPage} className="hidden">الصفحة {readerPosition.mushafPage}</option>
                  )}
                </select>
              </div>
            </label>
          ) : (
            <label className={fieldLabelClass}>
              الربع المختار
              <div className="relative">
                <select
                  data-testid="settings-current-rub"
                  value={readerPosition.currentRub}
                  onChange={(event) => setReaderPosition(prev => ({ ...prev, currentRub: Number(event.target.value) }))}
                  disabled={!availableRubs.length}
                  className={`w-full appearance-none ${fieldControlWithFocusClass} disabled:opacity-50`}
                >
                  {availableRubs.map((rubNum) => (
                    <option key={rubNum} value={rubNum}>
                      الربع {rubNum}
                    </option>
                  ))}
                  {/* Fallback if somehow empty but has a value */}
                  {!availableRubs.includes(readerPosition.currentRub) && (
                    <option value={readerPosition.currentRub} className="hidden">الربع {readerPosition.currentRub}</option>
                  )}
                </select>
              </div>
            </label>
          )}
        </div>

        <div className="mt-3.5 rounded-xl border border-line bg-surface/60 px-3 py-3 text-xs leading-6 text-muted sm:text-sm sm:leading-7">
          سيبدأ القارئ من {form.readingMode === "page" ? `الصفحة ${readerPosition.mushafPage}` : `الربع ${readerPosition.currentRub}`} بعد الحفظ واكتمال الإعداد.
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          data-testid="settings-save-button"
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink/90 sm:text-sm"
        >
          <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          حفظ التغييرات
        </button>
        <button
          data-testid="settings-reset-button"
          type="button"
          onClick={handleResetDefaults}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/75 px-4 py-2 text-xs font-semibold text-ink transition hover:border-accent/30 hover:text-accent sm:text-sm"
        >
          استعادة الافتراضيات
        </button>
        {saveNotice ? (
          <span
            role="status"
            aria-live="polite"
            className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
          >
            {saveNotice}
          </span>
        ) : null}
      </div>
    </div>
  );
}
