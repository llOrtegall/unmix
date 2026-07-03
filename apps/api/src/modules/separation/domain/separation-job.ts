import { AggregateRoot } from "../../../shared/kernel/domain-event.ts";
import { err, ok, type Result } from "../../../shared/kernel/result.ts";
import { type SeparationError, separationError } from "./errors.ts";
import {
  SEPARATION_COMPLETED,
  SEPARATION_FAILED,
  SEPARATION_REQUESTED,
  type SeparationCompleted,
} from "./events.ts";

import type { JobFailure, JobStatus, Stage } from "./types.ts";

export type { JobFailure, JobStatus, Stage, StemName } from "./types.ts";

export interface SeparationJobProps {
  id: string;
  trackId: string;
  model: string;
  status: JobStatus;
  stage: Stage | null;
  progress: number;
  failure: JobFailure | null;
  createdAt: Date;
  finishedAt: Date | null;
}

export interface RequestJob {
  id: string;
  eventId: string;
  trackId: string;
  inputKey: string;
  outputPrefix: string;
  model: string;
  now: Date;
}

export type SeparationResult = SeparationCompleted["payload"];

/** Lifecycle of one separation run. State changes return `true` when something changed. */
export class SeparationJob extends AggregateRoot {
  #props: SeparationJobProps;

  private constructor(props: SeparationJobProps) {
    super();
    this.#props = props;
  }

  static request(input: RequestJob): SeparationJob {
    const job = new SeparationJob({
      id: input.id,
      trackId: input.trackId,
      model: input.model,
      status: "queued",
      stage: null,
      progress: 0,
      failure: null,
      createdAt: input.now,
      finishedAt: null,
    });
    job.record({
      id: input.eventId,
      type: SEPARATION_REQUESTED,
      occurredAt: input.now,
      payload: {
        jobId: input.id,
        trackId: input.trackId,
        inputKey: input.inputKey,
        outputPrefix: input.outputPrefix,
        model: input.model,
      },
    });
    return job;
  }

  static restore(props: SeparationJobProps): SeparationJob {
    return new SeparationJob(props);
  }

  get id(): string {
    return this.#props.id;
  }

  get isFinished(): boolean {
    return this.#props.status === "completed" || this.#props.status === "failed";
  }

  recordProgress(stage: Stage, progress: number): boolean {
    if (this.isFinished) return false; // late event after the outcome
    const value = Math.max(0, Math.min(100, Math.round(progress)));
    if (this.#props.status === "processing" && this.#props.stage === stage && this.#props.progress === value) {
      return false;
    }
    this.#props.status = "processing";
    this.#props.stage = stage;
    this.#props.progress = value;
    return true;
  }

  complete(result: Omit<SeparationResult, "jobId" | "trackId">, eventId: string, now: Date): Result<boolean, SeparationError> {
    if (this.#props.status === "completed") return ok(false);
    if (this.#props.status === "failed") {
      return err(separationError("INVALID_TRANSITION", "A failed job cannot complete."));
    }
    if (result.stems.length === 0) {
      return err(separationError("INVALID_TRANSITION", "A completed job needs stems."));
    }
    this.#props.status = "completed";
    this.#props.stage = "uploading";
    this.#props.progress = 100;
    this.#props.finishedAt = now;
    this.record({
      id: eventId,
      type: SEPARATION_COMPLETED,
      occurredAt: now,
      payload: { jobId: this.#props.id, trackId: this.#props.trackId, ...result },
    });
    return ok(true);
  }

  fail(failure: JobFailure, eventId: string, now: Date): Result<boolean, SeparationError> {
    if (this.#props.status === "failed") return ok(false);
    if (this.#props.status === "completed") {
      return err(separationError("INVALID_TRANSITION", "A completed job cannot fail."));
    }
    this.#props.status = "failed";
    this.#props.failure = failure;
    this.#props.finishedAt = now;
    this.record({
      id: eventId,
      type: SEPARATION_FAILED,
      occurredAt: now,
      payload: { jobId: this.#props.id, trackId: this.#props.trackId, ...failure },
    });
    return ok(true);
  }

  toSnapshot(): Readonly<SeparationJobProps> {
    return { ...this.#props };
  }
}
