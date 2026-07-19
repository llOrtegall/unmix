import { InvalidEventTypeError } from "./errors/InvalidEventTypeError.ts";

export type EventTypePrimitive = string;

export class EventType {
  private static readonly FORMAT = /^[a-z_]+(\.[a-z_]+)+$/;

  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): EventType {
    EventType.ensureFormatIsValid(value);
    return new EventType(value);
  }

  static fromPrimitive(data: EventTypePrimitive): EventType {
    return EventType.create(data);
  }

  private static ensureFormatIsValid(value: string): void {
    if (!EventType.FORMAT.test(value)) throw new InvalidEventTypeError(value);
  }

  equals(other: EventType): boolean {
    return this.value === other.value;
  }

  toPrimitive(): EventTypePrimitive {
    return this.value;
  }
}
