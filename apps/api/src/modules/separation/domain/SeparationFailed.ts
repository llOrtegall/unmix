import { DomainEvent, type DomainEventPrimitive } from "../../shared/domain/DomainEvent.ts";
import { EventId } from "../../shared/domain/EventId.ts";
import { JobId, type JobIdPrimitive } from "../../shared/domain/JobId.ts";
import { OccurredAt } from "../../shared/domain/OccurredAt.ts";
import { TrackId, type TrackIdPrimitive } from "../../library/domain/TrackId.ts";
import { JobFailure, type JobFailurePrimitive } from "./JobFailure.ts";

export interface SeparationFailedPayload extends JobFailurePrimitive {
  readonly jobId: JobIdPrimitive;
  readonly trackId: TrackIdPrimitive;
}

export type SeparationFailedPrimitive = DomainEventPrimitive<SeparationFailedPayload>;

export interface SeparationFailedAttributes {
  readonly jobId: JobId;
  readonly trackId: TrackId;
  readonly failure: JobFailure;
}

export class SeparationFailed extends DomainEvent<SeparationFailedPayload> {
  static readonly TYPE = "separation.failed";

  private readonly jobId: JobId;
  private readonly trackId: TrackId;
  private readonly failure: JobFailure;

  private constructor(id: EventId, occurredAt: OccurredAt, attributes: SeparationFailedAttributes) {
    super(SeparationFailed.TYPE, id, occurredAt);
    this.jobId = attributes.jobId;
    this.trackId = attributes.trackId;
    this.failure = attributes.failure;
  }

  static create(id: EventId, occurredAt: OccurredAt, attributes: SeparationFailedAttributes): SeparationFailed {
    return new SeparationFailed(id, occurredAt, attributes);
  }

  static occur(attributes: SeparationFailedAttributes): SeparationFailed {
    return SeparationFailed.create(EventId.generate(), OccurredAt.now(), attributes);
  }

  static fromPrimitive(data: SeparationFailedPrimitive): SeparationFailed {
    SeparationFailed.ensureTypeIs(SeparationFailed.TYPE, data.type);
    const { jobId, trackId, ...failure } = data.payload;
    return SeparationFailed.create(EventId.fromPrimitive(data.id), OccurredAt.fromPrimitive(data.occurredAt), {
      jobId: JobId.fromPrimitive(jobId),
      trackId: TrackId.fromPrimitive(trackId),
      failure: JobFailure.fromPrimitive(failure),
    });
  }

  protected toPayloadPrimitive(): SeparationFailedPayload {
    return { jobId: this.jobId.toPrimitive(), trackId: this.trackId.toPrimitive(), ...this.failure.toPrimitive() };
  }
}
