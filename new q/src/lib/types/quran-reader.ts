export const QuranFont = {
  MadaniV2: "code_v2",
  FallbackQpcUthmaniHafs: "qpc_uthmani_hafs"
} as const;

export type QuranFont = (typeof QuranFont)[keyof typeof QuranFont];

export const MushafLines = {
  FifteenLines: 15,
  SixteenLines: 16
} as const;

export type MushafLines = (typeof MushafLines)[keyof typeof MushafLines];
