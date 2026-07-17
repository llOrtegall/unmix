import { UnexpectedEventTypeError } from "./errors/UnexpectedEventTypeError.ts";
import type { EventId, EventIdPrimitive } from "./EventId.ts";
import type { OccurredAt, OccurredAtPrimitive } from "./OccurredAt.ts";

export interface DomainEventPrimitive<TPayload extends object = object> {
  readonly id: EventIdPrimitive;
  readonly type: string;
  readonly occurredAt: OccurredAtPrimitive;
  readonly payload: TPayload;
}

export abstract class DomainEvent<TPayload extends object = object> {
  private readonly type: string;
  private readonly id: EventId;
  private readonly occurredAt: OccurredAt;

  protected constructor(type: string, id: EventId, occurredAt: OccurredAt) {
    this.type = type;
    this.id = id;
    this.occurredAt = occurredAt;
  }

  protected static ensureTypeIs(expected: string, actual: string): void {
    if (actual !== expected) throw new UnexpectedEventTypeError(expected, actual);
  }

  protected abstract toPayloadPrimitive(): TPayload;

  getId(): EventId {
    return this.id;
  }

  getType(): string {
    return this.type;
  }

  equals(other: DomainEvent): boolean {
    return this.id.equals(other.id);
  }

  toPrimitive(): DomainEventPrimitive<TPayload> {
    return {
      id: this.id.toPrimitive(),
      type: this.type,
      occurredAt: this.occurredAt.toPrimitive(),
      payload: this.toPayloadPrimitive(),
    };
  }
}
