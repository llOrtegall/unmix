import { TrackId, type TrackIdPrimitive } from "../../track/domain/TrackId.ts";
import { InvalidJobFailureError } from "./errors/InvalidJobFailureError.ts";
import { JobFailure, type JobFailurePrimitive } from "./JobFailure.ts";
import { JobId, type JobIdPrimitive } from "./JobId.ts";
import { JobStatus, type JobStatusPrimitive } from "./JobStatus.ts";
import { Progress, type ProgressPrimitive } from "./Progress.ts";
import { Stage, type StagePrimitive } from "./Stage.ts";

export interface JobPrimitive {
  readonly id: JobIdPrimitive;
  readonly trackId: TrackIdPrimitive;
  readonly status: JobStatusPrimitive;
  readonly stage: StagePrimitive | null;
  readonly progress: ProgressPrimitive;
  readonly failure: JobFailurePrimitive | null;
}

export interface JobAttributes {
  readonly id: JobId;
  readonly trackId: TrackId;
  readonly status: JobStatus;
  readonly stage: Stage | null;
  readonly progress: Progress;
  readonly failure: JobFailure | null;
}

export class Job {
  private readonly id: JobId;
  private readonly trackId: TrackId;
  private readonly status: JobStatus;
  private readonly stage: Stage | null;
  private readonly progress: Progress;
  private readonly failure: JobFailure | null;

  private constructor(attributes: JobAttributes) {
    this.id = attributes.id;
    this.trackId = attributes.trackId;
    this.status = attributes.status;
    this.stage = attributes.stage;
    this.progress = attributes.progress;
    this.failure = attributes.failure;
  }

  static create(attributes: JobAttributes): Job {
    Job.ensureOnlyFailedJobsHaveAFailure(attributes);
    return new Job(attributes);
  }

  static fromPrimitive(data: JobPrimitive): Job {
    return Job.create({
      id: JobId.fromPrimitive(data.id),
      trackId: TrackId.fromPrimitive(data.trackId),
      status: JobStatus.fromPrimitive(data.status),
      stage: data.stage === null ? null : Stage.fromPrimitive(data.stage),
      progress: Progress.fromPrimitive(data.progress),
      failure: data.failure === null ? null : JobFailure.fromPrimitive(data.failure),
    });
  }

  private static ensureOnlyFailedJobsHaveAFailure({ status, failure }: JobAttributes): void {
    if (status.hasFailed() !== (failure !== null)) throw new InvalidJobFailureError(`a ${status.toPrimitive()} job cannot have failure ${failure?.getCode() ?? "null"}`);
  }

  getId(): JobId {
    return this.id;
  }

  getProgress(): Progress {
    return this.progress;
  }

  getFailure(): JobFailure | null {
    return this.failure;
  }

  isCompleted(): boolean {
    return this.status.isCompleted();
  }

  hasFailed(): boolean {
    return this.status.hasFailed();
  }

  isFinished(): boolean {
    return this.status.isFinished();
  }

  activeStage(): Stage | null {
    return this.status.isProcessing() ? this.stage : null;
  }

  equals(other: Job): boolean {
    return this.id.equals(other.id);
  }

  toPrimitive(): JobPrimitive {
    return {
      id: this.id.toPrimitive(),
      trackId: this.trackId.toPrimitive(),
      status: this.status.toPrimitive(),
      stage: this.stage?.toPrimitive() ?? null,
      progress: this.progress.toPrimitive(),
      failure: this.failure?.toPrimitive() ?? null,
    };
  }
}
