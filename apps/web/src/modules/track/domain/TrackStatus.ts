import { InvalidTrackStatusError } from "./errors/InvalidTrackStatusError.ts";

const STATUSES = ["awaiting_upload", "uploaded", "separating", "completed", "failed"] as const;

export type TrackStatusPrimitive = (typeof STATUSES)[number];

export class TrackStatus {
  private readonly value: TrackStatusPrimitive;

  private constructor(value: TrackStatusPrimitive) {
    this.value = value;
  }

  static create(value: string): TrackStatus {
    TrackStatus.ensureIsKnown(value);
    return new TrackStatus(value);
  }

  static fromPrimitive(data: TrackStatusPrimitive): TrackStatus {
    return TrackStatus.create(data);
  }

  private static ensureIsKnown(value: string): asserts value is TrackStatusPrimitive {
    if (!STATUSES.includes(value as TrackStatusPrimitive)) throw new InvalidTrackStatusError(value);
  }

  isSeparating(): boolean {
    return this.value === "separating";
  }

  isCompleted(): boolean {
    return this.value === "completed";
  }

  equals(other: TrackStatus): boolean {
    return this.value === other.value;
  }

  toPrimitive(): TrackStatusPrimitive {
    return this.value;
  }
}
