import { InvalidPeaksError } from "./errors/InvalidPeaksError.ts";

export type WaveformPeaksPrimitive = readonly number[];

export class WaveformPeaks {
  private readonly values: readonly number[];

  private constructor(values: readonly number[]) {
    this.values = values;
  }

  static create(values: readonly number[]): WaveformPeaks {
    WaveformPeaks.ensureAreAmplitudes(values);
    return new WaveformPeaks([...values]);
  }

  static empty(): WaveformPeaks {
    return WaveformPeaks.create([]);
  }

  static fromPrimitive(data: WaveformPeaksPrimitive): WaveformPeaks {
    return WaveformPeaks.create(data);
  }

  private static ensureAreAmplitudes(values: readonly number[]): void {
    if (values.some((value) => !Number.isFinite(value) || value < 0)) {
      throw new InvalidPeaksError("every peak must be a non-negative number");
    }
  }

  loudest(): number {
    return Math.max(0, ...this.values);
  }

  isEmpty(): boolean {
    return this.values.length === 0;
  }

  equals(other: WaveformPeaks): boolean {
    return this.values.length === other.values.length && this.values.every((value, index) => other.values[index] === value);
  }

  toPrimitive(): WaveformPeaksPrimitive {
    return [...this.values];
  }
}
