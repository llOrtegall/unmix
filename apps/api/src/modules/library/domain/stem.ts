export type StemName = "vocals" | "drums" | "bass" | "guitar" | "piano" | "other";

export interface Stem {
  readonly name: StemName;
  readonly key: string;
  readonly sizeBytes: number;
  readonly silent: boolean;
}
