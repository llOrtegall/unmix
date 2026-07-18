import { DomainEvent, type DomainEventPrimitive } from "../../shared/domain/DomainEvent.ts";
import { EventId } from "../../shared/domain/EventId.ts";
import { JobId, type JobIdPrimitive } from "../../shared/domain/JobId.ts";
import { ObjectKey, type ObjectKeyPrimitive } from "../../shared/domain/ObjectKey.ts";
import { OccurredAt } from "../../shared/domain/OccurredAt.ts";
import { TrackId, type TrackIdPrimitive } from "../../library/domain/TrackId.ts";
import { ModelName, type ModelNamePrimitive } from "./ModelName.ts";

export interface SeparationRequestedPayload {
  readonly jobId: JobIdPrimitive;
  readonly trackId: TrackIdPrimitive;
  readonly inputKey: ObjectKeyPrimitive;
  readonly outputPrefix: ObjectKeyPrimitive;
  readonly model: ModelNamePrimitive;
}

export type SeparationRequestedPrimitive = DomainEventPrimitive<SeparationRequestedPayload>;

export interface SeparationRequestedAttributes {
  readonly jobId: JobId;
  readonly trackId: TrackId;
  readonly inputKey: ObjectKey;
  readonly outputPrefix: ObjectKey;
  readonly model: ModelName;
}

export class SeparationRequested extends DomainEvent<SeparationRequestedPayload> {
  static readonly TYPE = "separation.requested";

  private readonly jobId: JobId;
  private readonly trackId: TrackId;
  private readonly inputKey: ObjectKey;
  private readonly outputPrefix: ObjectKey;
  private readonly model: ModelName;

  private constructor(id: EventId, occurredAt: OccurredAt, attributes: SeparationRequestedAttributes) {
    super(SeparationRequested.TYPE, id, occurredAt);
    this.jobId = attributes.jobId;
    this.trackId = attributes.trackId;
    this.inputKey = attributes.inputKey;
    this.outputPrefix = attributes.outputPrefix;
    this.model = attributes.model;
  }

  static create(id: EventId, occurredAt: OccurredAt, attributes: SeparationRequestedAttributes): SeparationRequested {
    return new SeparationRequested(id, occurredAt, attributes);
  }

  static occur(attributes: SeparationRequestedAttributes): SeparationRequested {
    return SeparationRequested.create(EventId.generate(), OccurredAt.now(), attributes);
  }

  static fromPrimitive(data: SeparationRequestedPrimitive): SeparationRequested {
    SeparationRequested.ensureTypeIs(SeparationRequested.TYPE, data.type);
    return SeparationRequested.create(EventId.fromPrimitive(data.id), OccurredAt.fromPrimitive(data.occurredAt), {
      jobId: JobId.fromPrimitive(data.payload.jobId),
      trackId: TrackId.fromPrimitive(data.payload.trackId),
      inputKey: ObjectKey.fromPrimitive(data.payload.inputKey),
      outputPrefix: ObjectKey.fromPrimitive(data.payload.outputPrefix),
      model: ModelName.fromPrimitive(data.payload.model),
    });
  }

  protected toPayloadPrimitive(): SeparationRequestedPayload {
    return {
      jobId: this.jobId.toPrimitive(),
      trackId: this.trackId.toPrimitive(),
      inputKey: this.inputKey.toPrimitive(),
      outputPrefix: this.outputPrefix.toPrimitive(),
      model: this.model.toPrimitive(),
    };
  }
}
