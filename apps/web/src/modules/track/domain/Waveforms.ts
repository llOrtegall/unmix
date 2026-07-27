import { StemName, type StemNamePrimitive } from "./StemName.ts";
import { WaveformPeaks, type WaveformPeaksPrimitive } from "./WaveformPeaks.ts";

export type WaveformsPrimitive = Readonly<Partial<Record<StemNamePrimitive, WaveformPeaksPrimitive>>>;

export class Waveforms {
  private readonly peaks: ReadonlyMap<StemNamePrimitive, WaveformPeaks>;

  private constructor(peaks: ReadonlyMap<StemNamePrimitive, WaveformPeaks>) {
    this.peaks = peaks;
  }

  static create(entries: readonly (readonly [StemName, WaveformPeaks])[]): Waveforms {
    return new Waveforms(new Map(entries.map(([name, peaks]) => [name.toPrimitive(), peaks])));
  }

  static empty(): Waveforms {
    return Waveforms.create([]);
  }

  static fromPrimitive(data: WaveformsPrimitive): Waveforms {
    return Waveforms.create(
      Object.entries(data).map(([name, peaks]) => [StemName.create(name), WaveformPeaks.fromPrimitive(peaks ?? [])] as const),
    );
  }

  peaksFor(name: StemName): WaveformPeaks {
    return this.peaks.get(name.toPrimitive()) ?? WaveformPeaks.empty();
  }

  loudest(): number {
    return Math.max(0, ...[...this.peaks.values()].map((peaks) => peaks.loudest()));
  }

  equals(other: Waveforms): boolean {
    return this.peaks.size === other.peaks.size && [...this.peaks].every(([name, peaks]) => other.peaks.get(name)?.equals(peaks));
  }

  toPrimitive(): WaveformsPrimitive {
    return Object.fromEntries([...this.peaks].map(([name, peaks]) => [name, peaks.toPrimitive()]));
  }
}
