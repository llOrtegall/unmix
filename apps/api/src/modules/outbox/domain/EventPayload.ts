import { InvalidEventPayloadError } from "./errors/InvalidEventPayloadError.ts";

export type EventPayloadPrimitive = Readonly<Record<string, unknown>>;

export class EventPayload {
  private readonly value: EventPayloadPrimitive;

  private constructor(value: EventPayloadPrimitive) {
    this.value = value;
  }

  static create(value: unknown): EventPayload {
    EventPayload.ensureIsAnObject(value);
    return new EventPayload(structuredClone(value));
  }

  static fromPrimitive(data: EventPayloadPrimitive): EventPayload {
    return EventPayload.create(data);
  }

  private static ensureIsAnObject(value: unknown): asserts value is EventPayloadPrimitive {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new InvalidEventPayloadError("it is not an object");
    }
  }

  equals(other: EventPayload): boolean {
    return JSON.stringify(this.value) === JSON.stringify(other.value);
  }

  toPrimitive(): EventPayloadPrimitive {
    return structuredClone(this.value);
  }
}
