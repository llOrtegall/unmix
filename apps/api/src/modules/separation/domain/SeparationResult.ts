import { StemList, type StemListPrimitive } from "../../library/domain/StemList.ts";
import { TrackDuration, type TrackDurationPrimitive } from "../../library/domain/TrackDuration.ts";
import { InvalidSeparationResultError } from "./errors/InvalidSeparationResultError.ts";

export interface SeparationResultPrimitive {
  readonly durationSeconds: TrackDurationPrimitive;
  readonly stems: StemListPrimitive;
}

export class SeparationResult {
  private readonly duration: TrackDuration;
  private readonly stems: StemList;

  private constructor(duration: TrackDuration, stems: StemList) {
    this.duration = duration;
    this.stems = stems;
  }

  static create(duration: TrackDuration, stems: StemList): SeparationResult {
    SeparationResult.ensureHasStems(stems);
    return new SeparationResult(duration, stems);
  }

  static fromPrimitive(data: SeparationResultPrimitive): SeparationResult {
    return SeparationResult.create(TrackDuration.fromPrimitive(data.durationSeconds), StemList.fromPrimitive(data.stems));
  }

  private static ensureHasStems(stems: StemList): void {
    if (stems.isEmpty()) throw new InvalidSeparationResultError("a separation produces at least one stem");
  }

  equals(other: SeparationResult): boolean {
    return this.duration.equals(other.duration) && this.stems.equals(other.stems);
  }

  toPrimitive(): SeparationResultPrimitive {
    return { durationSeconds: this.duration.toPrimitive(), stems: this.stems.toPrimitive() };
  }
}
