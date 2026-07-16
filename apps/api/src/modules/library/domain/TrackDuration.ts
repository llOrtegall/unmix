import { InvalidTrackDurationError } from "./errors/InvalidTrackDurationError.ts";

export type TrackDurationPrimitive = number;

export class TrackDuration {
  private readonly seconds: number;

  private constructor(seconds: number) {
    this.seconds = seconds;
  }

  static create(seconds: number): TrackDuration {
    TrackDuration.ensureIsAFiniteNonNegativeNumber(seconds);
    return new TrackDuration(seconds);
  }

  static fromPrimitive(data: TrackDurationPrimitive): TrackDuration {
    return TrackDuration.create(data);
  }

  private static ensureIsAFiniteNonNegativeNumber(seconds: number): void {
    if (!Number.isFinite(seconds) || seconds < 0) throw new InvalidTrackDurationError(seconds);
  }

  equals(other: TrackDuration): boolean {
    return this.seconds === other.seconds;
  }

  toPrimitive(): TrackDurationPrimitive {
    return this.seconds;
  }
}
