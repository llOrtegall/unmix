export type StemName = "vocals" | "drums" | "bass" | "guitar" | "piano" | "other";

export interface Stem {
  readonly name: StemName;
  readonly key: string;
  readonly sizeBytes: number;
  readonly silent: boolean;
  /** Lossy copy for streaming playback. */
  readonly previewKey: string;
  /** Waveform peaks JSON. */
  readonly peaksKey: string;
  /** Basic Pitch transcription; null for drums, silent stems and older tracks. */
  readonly midiKey: string | null;
}
