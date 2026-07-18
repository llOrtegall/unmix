import { DomainEvent, type DomainEventPrimitive } from "../../shared/domain/DomainEvent.ts";
import { EventId } from "../../shared/domain/EventId.ts";
import { JobId, type JobIdPrimitive } from "../../shared/domain/JobId.ts";
import { OccurredAt } from "../../shared/domain/OccurredAt.ts";
import { TrackId, type TrackIdPrimitive } from "../../library/domain/TrackId.ts";
import { SeparationResult, type SeparationResultPrimitive } from "./SeparationResult.ts";

export interface SeparationCompletedPayload extends SeparationResultPrimitive {
  readonly jobId: JobIdPrimitive;
  readonly trackId: TrackIdPrimitive;
}

export type SeparationCompletedPrimitive = DomainEventPrimitive<SeparationCompletedPayload>;

export interface SeparationCompletedAttributes {
  readonly jobId: JobId;
  readonly trackId: TrackId;
  readonly result: SeparationResult;
}

export class SeparationCompleted extends DomainEvent<SeparationCompletedPayload> {
  static readonly TYPE = "separation.completed";

  private readonly jobId: JobId;
  private readonly trackId: TrackId;
  private readonly result: SeparationResult;

  private constructor(id: EventId, occurredAt: OccurredAt, attributes: SeparationCompletedAttributes) {
    super(SeparationCompleted.TYPE, id, occurredAt);
    this.jobId = attributes.jobId;
    this.trackId = attributes.trackId;
    this.result = attributes.result;
  }

  static create(id: EventId, occurredAt: OccurredAt, attributes: SeparationCompletedAttributes): SeparationCompleted {
    return new SeparationCompleted(id, occurredAt, attributes);
  }

  static occur(attributes: SeparationCompletedAttributes): SeparationCompleted {
    return SeparationCompleted.create(EventId.generate(), OccurredAt.now(), attributes);
  }

  static fromPrimitive(data: SeparationCompletedPrimitive): SeparationCompleted {
    SeparationCompleted.ensureTypeIs(SeparationCompleted.TYPE, data.type);
    const { jobId, trackId, ...result } = data.payload;
    return SeparationCompleted.create(EventId.fromPrimitive(data.id), OccurredAt.fromPrimitive(data.occurredAt), {
      jobId: JobId.fromPrimitive(jobId),
      trackId: TrackId.fromPrimitive(trackId),
      result: SeparationResult.fromPrimitive(result),
    });
  }

  protected toPayloadPrimitive(): SeparationCompletedPayload {
    return { jobId: this.jobId.toPrimitive(), trackId: this.trackId.toPrimitive(), ...this.result.toPrimitive() };
  }
}
