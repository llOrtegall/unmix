import { InvalidTrackIdError } from "./errors/InvalidTrackIdError.ts";

export type TrackIdPrimitive = string;

export class TrackId {
  private static readonly UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): TrackId {
    TrackId.ensureIsUuid(value);
    return new TrackId(value.toLowerCase());
  }

  static generate(): TrackId {
    return TrackId.create(crypto.randomUUID());
  }

  static fromPrimitive(data: TrackIdPrimitive): TrackId {
    return TrackId.create(data);
  }

  private static ensureIsUuid(value: string): void {
    if (!TrackId.UUID_FORMAT.test(value)) throw new InvalidTrackIdError(value);
  }

  equals(other: TrackId): boolean {
    return this.value === other.value;
  }

  toPrimitive(): TrackIdPrimitive {
    return this.value;
  }
}
