import { InvalidTrackIdError } from "./errors/InvalidTrackIdError.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type TrackIdPrimitive = string;

export class TrackId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): TrackId {
    TrackId.ensureIsUuid(value);
    return new TrackId(value);
  }

  static fromPrimitive(data: TrackIdPrimitive): TrackId {
    return TrackId.create(data);
  }

  private static ensureIsUuid(value: string): void {
    if (!UUID.test(value)) throw new InvalidTrackIdError(value);
  }

  equals(other: TrackId): boolean {
    return this.value === other.value;
  }

  toPrimitive(): TrackIdPrimitive {
    return this.value;
  }
}
