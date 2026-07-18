import { CreatedAt, type CreatedAtPrimitive } from "../../shared/domain/CreatedAt.ts";
import { DomainEventList } from "../../shared/domain/DomainEventList.ts";
import { JobId, type JobIdPrimitive } from "../../shared/domain/JobId.ts";
import type { Track } from "../../library/domain/Track.ts";
import { TrackId, type TrackIdPrimitive } from "../../library/domain/TrackId.ts";
import { InvalidJobTransitionError } from "./errors/InvalidJobTransitionError.ts";
import { InvalidSeparationJobError } from "./errors/InvalidSeparationJobError.ts";
import { FinishedAt, type FinishedAtPrimitive } from "./FinishedAt.ts";
import { JobFailure, type JobFailurePrimitive } from "./JobFailure.ts";
import { JobStatus, type JobStatusPrimitive } from "./JobStatus.ts";
import { ModelName, type ModelNamePrimitive } from "./ModelName.ts";
import { Progress, type ProgressPrimitive } from "./Progress.ts";
import { SeparationCompleted } from "./SeparationCompleted.ts";
import { SeparationFailed } from "./SeparationFailed.ts";
import { SeparationRequested } from "./SeparationRequested.ts";
import type { SeparationResult } from "./SeparationResult.ts";
import { Stage, type StagePrimitive } from "./Stage.ts";

export interface SeparationJobPrimitive {
  readonly id: JobIdPrimitive;
  readonly trackId: TrackIdPrimitive;
  readonly model: ModelNamePrimitive;
  readonly status: JobStatusPrimitive;
  readonly stage: StagePrimitive | null;
  readonly progress: ProgressPrimitive;
  readonly failure: JobFailurePrimitive | null;
  readonly createdAt: CreatedAtPrimitive;
  readonly finishedAt: FinishedAtPrimitive | null;
}

export interface SeparationJobAttributes {
  readonly id: JobId;
  readonly trackId: TrackId;
  readonly model: ModelName;
  readonly status: JobStatus;
  readonly stage: Stage | null;
  readonly progress: Progress;
  readonly failure: JobFailure | null;
  readonly createdAt: CreatedAt;
  readonly finishedAt: FinishedAt | null;
  readonly events: DomainEventList;
}

export class SeparationJob {
  private readonly id: JobId;
  private readonly trackId: TrackId;
  private readonly model: ModelName;
  private readonly status: JobStatus;
  private readonly stage: Stage | null;
  private readonly progress: Progress;
  private readonly failure: JobFailure | null;
  private readonly createdAt: CreatedAt;
  private readonly finishedAt: FinishedAt | null;
  private readonly events: DomainEventList;

  private constructor(attributes: SeparationJobAttributes) {
    this.id = attributes.id;
    this.trackId = attributes.trackId;
    this.model = attributes.model;
    this.status = attributes.status;
    this.stage = attributes.stage;
    this.progress = attributes.progress;
    this.failure = attributes.failure;
    this.createdAt = attributes.createdAt;
    this.finishedAt = attributes.finishedAt;
    this.events = attributes.events;
  }

  static create(attributes: SeparationJobAttributes): SeparationJob {
    SeparationJob.ensureFailureMatchesStatus(attributes);
    SeparationJob.ensureFinishedAtMatchesStatus(attributes);
    SeparationJob.ensureProcessingHasAStage(attributes);
    return new SeparationJob(attributes);
  }

  static request(track: Track, model: ModelName): SeparationJob {
    const id = JobId.generate();
    const requested = SeparationRequested.occur({
      jobId: id,
      trackId: track.getId(),
      inputKey: track.getInputKey(),
      outputPrefix: track.getStemsPrefix(),
      model,
    });
    return SeparationJob.create({
      id,
      trackId: track.getId(),
      model,
      status: JobStatus.queued(),
      stage: null,
      progress: Progress.none(),
      failure: null,
      createdAt: CreatedAt.now(),
      finishedAt: null,
      events: DomainEventList.empty().add(requested),
    });
  }

  static fromPrimitive(data: SeparationJobPrimitive): SeparationJob {
    return SeparationJob.create({
      id: JobId.fromPrimitive(data.id),
      trackId: TrackId.fromPrimitive(data.trackId),
      model: ModelName.fromPrimitive(data.model),
      status: JobStatus.fromPrimitive(data.status),
      stage: data.stage === null ? null : Stage.fromPrimitive(data.stage),
      progress: Progress.fromPrimitive(data.progress),
      failure: data.failure === null ? null : JobFailure.fromPrimitive(data.failure),
      createdAt: CreatedAt.fromPrimitive(data.createdAt),
      finishedAt: data.finishedAt === null ? null : FinishedAt.fromPrimitive(data.finishedAt),
      events: DomainEventList.empty(),
    });
  }

  private static ensureFailureMatchesStatus({ id, status, failure }: SeparationJobAttributes): void {
    if (status.isFailed() !== (failure !== null)) {
      throw new InvalidSeparationJobError(id.toPrimitive(), "only a failed job has a failure");
    }
  }

  private static ensureFinishedAtMatchesStatus({ id, status, finishedAt }: SeparationJobAttributes): void {
    if (status.isFinished() !== (finishedAt !== null)) {
      throw new InvalidSeparationJobError(id.toPrimitive(), "only a finished job has a finish date");
    }
  }

  private static ensureProcessingHasAStage({ id, status, stage }: SeparationJobAttributes): void {
    if (status.isProcessing() && stage === null) {
      throw new InvalidSeparationJobError(id.toPrimitive(), "a processing job has a stage");
    }
  }

  getId(): JobId {
    return this.id;
  }

  getTrackId(): TrackId {
    return this.trackId;
  }

  getEvents(): DomainEventList {
    return this.events;
  }

  isFinished(): boolean {
    return this.status.isFinished();
  }

  recordProgress(stage: Stage, progress: Progress): SeparationJob {
    if (this.isFinished()) return this;
    return SeparationJob.create({ ...this.attributes(), status: JobStatus.processing(), stage, progress });
  }

  complete(result: SeparationResult): SeparationJob {
    if (this.status.isCompleted()) return this;
    this.ensureIsNotFinished(JobStatus.completed());
    return SeparationJob.create({
      ...this.attributes(),
      status: JobStatus.completed(),
      stage: Stage.uploading(),
      progress: Progress.full(),
      finishedAt: FinishedAt.now(),
      events: this.events.add(SeparationCompleted.occur({ jobId: this.id, trackId: this.trackId, result })),
    });
  }

  fail(failure: JobFailure): SeparationJob {
    if (this.status.isFailed()) return this;
    this.ensureIsNotFinished(JobStatus.failed());
    return SeparationJob.create({
      ...this.attributes(),
      status: JobStatus.failed(),
      failure,
      finishedAt: FinishedAt.now(),
      events: this.events.add(SeparationFailed.occur({ jobId: this.id, trackId: this.trackId, failure })),
    });
  }

  // A queued job may still be waiting in the outbox; only a job the worker had started is lost.
  markAsLost(): SeparationJob {
    if (!this.status.isProcessing()) return this;
    return this.fail(JobFailure.lostFromQueue());
  }

  private ensureIsNotFinished(next: JobStatus): void {
    if (this.isFinished()) {
      throw new InvalidJobTransitionError(this.id.toPrimitive(), this.status.toPrimitive(), next.toPrimitive());
    }
  }

  private attributes(): SeparationJobAttributes {
    return {
      id: this.id,
      trackId: this.trackId,
      model: this.model,
      status: this.status,
      stage: this.stage,
      progress: this.progress,
      failure: this.failure,
      createdAt: this.createdAt,
      finishedAt: this.finishedAt,
      events: this.events,
    };
  }

  equals(other: SeparationJob): boolean {
    return this.id.equals(other.id);
  }

  toPrimitive(): SeparationJobPrimitive {
    return {
      id: this.id.toPrimitive(),
      trackId: this.trackId.toPrimitive(),
      model: this.model.toPrimitive(),
      status: this.status.toPrimitive(),
      stage: this.stage?.toPrimitive() ?? null,
      progress: this.progress.toPrimitive(),
      failure: this.failure?.toPrimitive() ?? null,
      createdAt: this.createdAt.toPrimitive(),
      finishedAt: this.finishedAt?.toPrimitive() ?? null,
    };
  }
}
