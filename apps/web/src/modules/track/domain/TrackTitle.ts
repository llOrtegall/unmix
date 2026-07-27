import { InvalidTrackTitleError } from "./errors/InvalidTrackTitleError.ts";

export type TrackTitlePrimitive = string;

export class TrackTitle {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): TrackTitle {
    const trimmed = value.trim();
    TrackTitle.ensureIsNotEmpty(trimmed);
    return new TrackTitle(trimmed);
  }

  static fromPrimitive(data: TrackTitlePrimitive): TrackTitle {
    return TrackTitle.create(data);
  }

  private static ensureIsNotEmpty(value: string): void {
    if (value.length === 0) throw new InvalidTrackTitleError("it is empty");
  }

  equals(other: TrackTitle): boolean {
    return this.value === other.value;
  }

  toPrimitive(): TrackTitlePrimitive {
    return this.value;
  }
}
