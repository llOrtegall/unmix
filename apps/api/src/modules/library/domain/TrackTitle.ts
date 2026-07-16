import { InvalidTrackTitleError } from "./errors/InvalidTrackTitleError.ts";
import type { OriginalFilename } from "./OriginalFilename.ts";

export type TrackTitlePrimitive = string;

export class TrackTitle {
  private static readonly MAX_LENGTH = 255;

  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): TrackTitle {
    const trimmed = value.trim();
    TrackTitle.ensureIsNotEmpty(trimmed);
    TrackTitle.ensureDoesNotExceedMaxLength(trimmed);
    return new TrackTitle(trimmed);
  }

  static fromFilename(filename: OriginalFilename): TrackTitle {
    return TrackTitle.create(filename.withoutExtension() || filename.toPrimitive());
  }

  static fromPrimitive(data: TrackTitlePrimitive): TrackTitle {
    return TrackTitle.create(data);
  }

  private static ensureIsNotEmpty(value: string): void {
    if (value.length === 0) throw new InvalidTrackTitleError("it is empty");
  }

  private static ensureDoesNotExceedMaxLength(value: string): void {
    if (value.length > TrackTitle.MAX_LENGTH) {
      throw new InvalidTrackTitleError(`it exceeds ${TrackTitle.MAX_LENGTH} characters`);
    }
  }

  equals(other: TrackTitle): boolean {
    return this.value === other.value;
  }

  toPrimitive(): TrackTitlePrimitive {
    return this.value;
  }
}
