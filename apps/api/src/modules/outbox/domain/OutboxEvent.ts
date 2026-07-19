import { EventId, type EventIdPrimitive } from "../../shared/domain/EventId.ts";
import { DeliveryAttempts, type DeliveryAttemptsPrimitive } from "./DeliveryAttempts.ts";
import { DeliveryFailure, type DeliveryFailurePrimitive } from "./DeliveryFailure.ts";
import { EventPayload, type EventPayloadPrimitive } from "./EventPayload.ts";
import { EventType, type EventTypePrimitive } from "./EventType.ts";
import { PublishedAt, type PublishedAtPrimitive } from "./PublishedAt.ts";

export interface OutboxEventPrimitive {
  readonly id: EventIdPrimitive;
  readonly type: EventTypePrimitive;
  readonly payload: EventPayloadPrimitive;
  readonly attempts: DeliveryAttemptsPrimitive;
  readonly publishedAt: PublishedAtPrimitive | null;
  readonly lastFailure: DeliveryFailurePrimitive | null;
}

export interface OutboxEventAttributes {
  readonly id: EventId;
  readonly type: EventType;
  readonly payload: EventPayload;
  readonly attempts: DeliveryAttempts;
  readonly publishedAt: PublishedAt | null;
  readonly lastFailure: DeliveryFailure | null;
}

export class OutboxEvent {
  private readonly id: EventId;
  private readonly type: EventType;
  private readonly payload: EventPayload;
  private readonly attempts: DeliveryAttempts;
  private readonly publishedAt: PublishedAt | null;
  private readonly lastFailure: DeliveryFailure | null;

  private constructor(attributes: OutboxEventAttributes) {
    this.id = attributes.id;
    this.type = attributes.type;
    this.payload = attributes.payload;
    this.attempts = attributes.attempts;
    this.publishedAt = attributes.publishedAt;
    this.lastFailure = attributes.lastFailure;
  }

  static create(attributes: OutboxEventAttributes): OutboxEvent {
    return new OutboxEvent(attributes);
  }

  static fromPrimitive(data: OutboxEventPrimitive): OutboxEvent {
    return OutboxEvent.create({
      id: EventId.fromPrimitive(data.id),
      type: EventType.fromPrimitive(data.type),
      payload: EventPayload.fromPrimitive(data.payload),
      attempts: DeliveryAttempts.fromPrimitive(data.attempts),
      publishedAt: data.publishedAt === null ? null : PublishedAt.fromPrimitive(data.publishedAt),
      lastFailure: data.lastFailure === null ? null : DeliveryFailure.fromPrimitive(data.lastFailure),
    });
  }

  getId(): EventId {
    return this.id;
  }

  isPublished(): boolean {
    return this.publishedAt !== null;
  }

  markAsPublished(): OutboxEvent {
    if (this.isPublished()) return this;
    return OutboxEvent.create({ ...this.attributes(), publishedAt: PublishedAt.now() });
  }

  recordFailure(failure: DeliveryFailure): OutboxEvent {
    return OutboxEvent.create({ ...this.attributes(), attempts: this.attempts.increment(), lastFailure: failure });
  }

  private attributes(): OutboxEventAttributes {
    return {
      id: this.id,
      type: this.type,
      payload: this.payload,
      attempts: this.attempts,
      publishedAt: this.publishedAt,
      lastFailure: this.lastFailure,
    };
  }

  equals(other: OutboxEvent): boolean {
    return this.id.equals(other.id);
  }

  toPrimitive(): OutboxEventPrimitive {
    return {
      id: this.id.toPrimitive(),
      type: this.type.toPrimitive(),
      payload: this.payload.toPrimitive(),
      attempts: this.attempts.toPrimitive(),
      publishedAt: this.publishedAt?.toPrimitive() ?? null,
      lastFailure: this.lastFailure?.toPrimitive() ?? null,
    };
  }
}
