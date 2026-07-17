import { DomainEvent, type DomainEventPrimitive } from "../../domain/DomainEvent.ts";
import { EventId } from "../../domain/EventId.ts";
import { OccurredAt } from "../../domain/OccurredAt.ts";

export interface SampleEventPayload {
  readonly note: string;
}

export type SampleEventPrimitive = DomainEventPrimitive<SampleEventPayload>;

export class SampleEvent extends DomainEvent<SampleEventPayload> {
  static readonly TYPE = "sample.happened";

  private readonly note: string;

  private constructor(id: EventId, occurredAt: OccurredAt, note: string) {
    super(SampleEvent.TYPE, id, occurredAt);
    this.note = note;
  }

  static create(id: EventId, occurredAt: OccurredAt, note: string): SampleEvent {
    return new SampleEvent(id, occurredAt, note);
  }

  static fromPrimitive(data: SampleEventPrimitive): SampleEvent {
    SampleEvent.ensureTypeIs(SampleEvent.TYPE, data.type);
    return SampleEvent.create(EventId.fromPrimitive(data.id), OccurredAt.fromPrimitive(data.occurredAt), data.payload.note);
  }

  protected toPayloadPrimitive(): SampleEventPayload {
    return { note: this.note };
  }
}
