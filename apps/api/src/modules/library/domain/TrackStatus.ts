import { InvalidTrackStatusError } from "./errors/InvalidTrackStatusError.ts";

const STATUSES = ["awaiting_upload", "uploaded", "separating", "completed", "failed"] as const;
const READY_FOR_SEPARATION: readonly TrackStatusPrimitive[] = ["awaiting_upload", "uploaded", "failed"];

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

  static awaitingUpload(): TrackStatus {
    return TrackStatus.create("awaiting_upload");
  }

  static separating(): TrackStatus {
    return TrackStatus.create("separating");
  }

  static completed(): TrackStatus {
    return TrackStatus.create("completed");
  }

  static failed(): TrackStatus {
    return TrackStatus.create("failed");
  }

  static fromPrimitive(data: TrackStatusPrimitive): TrackStatus {
    return TrackStatus.create(data);
  }

  private static ensureIsKnown(value: string): asserts value is TrackStatusPrimitive {
    if (!STATUSES.includes(value as TrackStatusPrimitive)) throw new InvalidTrackStatusError(value);
  }

  allowsNewSeparation(): boolean {
    return READY_FOR_SEPARATION.includes(this.value);
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
