export type StemName = "vocals" | "drums" | "bass" | "guitar" | "piano" | "other";

/** Display order in the mixer: the parts people look for first come first. */
export const STEM_ORDER: readonly StemName[] = ["vocals", "drums", "bass", "guitar", "piano", "other"];

export interface Stem {
  name: StemName;
  downloadUrl: string;
  previewUrl: string;
  peaksUrl: string;
  sizeBytes: number;
  /** The worker found almost no signal in this stem (e.g. piano in a song without piano). */
  silent: boolean;
}

export function sortStems<T extends { name: StemName }>(stems: T[]): T[] {
  return [...stems].sort((a, b) => STEM_ORDER.indexOf(a.name) - STEM_ORDER.indexOf(b.name));
}
