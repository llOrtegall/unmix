import { InvalidEventIdError } from "./errors/InvalidEventIdError.ts";

export type EventIdPrimitive = string;

export class EventId {
  private static readonly UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): EventId {
    EventId.ensureIsUuid(value);
    return new EventId(value.toLowerCase());
  }

  static generate(): EventId {
    return EventId.create(crypto.randomUUID());
  }

  static fromPrimitive(data: EventIdPrimitive): EventId {
    return EventId.create(data);
  }

  private static ensureIsUuid(value: string): void {
    if (!EventId.UUID_FORMAT.test(value)) throw new InvalidEventIdError(value);
  }

  equals(other: EventId): boolean {
    return this.value === other.value;
  }

  toPrimitive(): EventIdPrimitive {
    return this.value;
  }
}
