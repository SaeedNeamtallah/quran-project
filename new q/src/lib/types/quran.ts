export type ReadingMode = "rub" | "page";

export type SessionPhase = "study" | "break";

export interface QuranWord {
  position: number;
  verse_key: string;
  char_type_name?: string;
  text_uthmani?: string;
  text_qpc_hafs?: string;
  text?: string;
  code_v2?: string;
  page_number?: number;
  line_number?: number;
  v2_page?: number;
  line_v2?: number;
}

export interface QuranVerse {
  id: number;
  verse_number: number;
  verse_key: string;
  hizb_number: number;
  rub_el_hizb_number: number;
  ruku_number: number;
  manzil_number: number;
  sajdah_number?: number | null;
  text_uthmani: string;
  page_number: number;
  juz_number: number;
  chapter_id?: number;
  words?: QuranWord[];
}

export interface RubPageSourcePayload {
  page_number: number;
  visible_verse_keys: string[];
  verses: QuranVerse[];
}

export interface PaginationPayload {
  current_page?: number;
  next_page?: number | null;
  total_records?: number;
}

export interface RubResponse {
  rub_number: number | string;
  verses: QuranVerse[];
  page_sources?: RubPageSourcePayload[];
}

export interface PaginatedVersesResponse {
  verses: QuranVerse[];
  pagination?: PaginationPayload;
}

export interface VerseAudioResponse {
  verse_key: string;
  verse_text: string;
  recitation_id: number;
  audio_url: string;
}

export interface TafsirSourcePayload {
  resource_id: number;
  name: string;
  language_name: string;
  text: string;
  plain_text: string;
}

export interface TafsirPayload {
  verse_key: string;
  verse_text: string;
  tafsir: TafsirSourcePayload;
}

export interface TafsirEnhancePayload {
  plain_text: string;
  provider: "auto" | "google" | "groq";
  model: string;
  segments: string[];
}

export interface Recitation {
  id: number;
  name: string;
  style: string;
  label: string;
}

export interface RecitationsPayload {
  default_recitation_id: number;
  recitations: Recitation[];
}

export interface RubRecitationTrack {
  verse_key: string;
  url: string;
}

export interface RubRecitationPayload {
  rub_number: number;
  count: number;
  recitation_id: number;
  audio_files: RubRecitationTrack[];
}

export interface PageRecitationPayload {
  page_number: number;
  recitation_id: number;
  audio_files: RubRecitationTrack[];
}

export interface WordTimingSegment {
  position: number;
  start_ms: number;
  end_ms: number;
}

export interface VerseWordTiming {
  verse_start_ms: number;
  verse_end_ms: number;
  segments: WordTimingSegment[];
}

export interface RubWordTimingsPayload {
  rub_number: number;
  count: number;
  recitation_id: number;
  word_timings: Record<string, VerseWordTiming>;
}

export interface PageWordTimingsPayload {
  page_number: number;
  recitation_id: number;
  word_timings: Record<string, VerseWordTiming>;
}

export interface AppStatusPayload {
  offline: boolean;
  rubs: number;
  pages: number;
  chapters: number;
  current_rub: number;
  backendAvailable?: boolean;
}

export interface OfflineQuranData {
  rubs: Record<string, QuranVerse[]>;
  pages: Record<string, QuranVerse[]>;
  chapters: Record<string, QuranVerse[]>;
}
