import { InvalidQueueJobStateError } from "./errors/InvalidQueueJobStateError.ts";
import { JobFailure, type JobFailurePrimitive } from "./JobFailure.ts";
import { Progress, type ProgressPrimitive } from "./Progress.ts";
import type { SeparationJob } from "./SeparationJob.ts";
import { SeparationResult, type SeparationResultPrimitive } from "./SeparationResult.ts";
import { Stage, type StagePrimitive } from "./Stage.ts";

const STATES = ["pending", "active", "completed", "failed", "missing"] as const;

type QueueStateName = (typeof STATES)[number];

export type QueueJobStatePrimitive =
  | { readonly state: "pending" }
  | { readonly state: "active"; readonly stage: StagePrimitive; readonly progress: ProgressPrimitive }
  | { readonly state: "completed"; readonly result: SeparationResultPrimitive }
  | { readonly state: "failed"; readonly failure: JobFailurePrimitive }
  | { readonly state: "missing" };

type QueueJobStateValue =
  | { readonly state: "pending" }
  | { readonly state: "active"; readonly stage: Stage; readonly progress: Progress }
  | { readonly state: "completed"; readonly result: SeparationResult }
  | { readonly state: "failed"; readonly failure: JobFailure }
  | { readonly state: "missing" };

export class QueueJobState {
  private readonly value: QueueJobStateValue;

  private constructor(value: QueueJobStateValue) {
    this.value = value;
  }

  static create(value: QueueJobStateValue): QueueJobState {
    QueueJobState.ensureStateIsKnown(value.state);
    return new QueueJobState(value);
  }

  static pending(): QueueJobState {
    return QueueJobState.create({ state: "pending" });
  }

  static active(stage: Stage, progress: Progress): QueueJobState {
    return QueueJobState.create({ state: "active", stage, progress });
  }

  static completed(result: SeparationResult): QueueJobState {
    return QueueJobState.create({ state: "completed", result });
  }

  static failed(failure: JobFailure): QueueJobState {
    return QueueJobState.create({ state: "failed", failure });
  }

  static missing(): QueueJobState {
    return QueueJobState.create({ state: "missing" });
  }

  static fromPrimitive(data: QueueJobStatePrimitive): QueueJobState {
    switch (data.state) {
      case "active":
        return QueueJobState.active(Stage.fromPrimitive(data.stage), Progress.fromPrimitive(data.progress));
      case "completed":
        return QueueJobState.completed(SeparationResult.fromPrimitive(data.result));
      case "failed":
        return QueueJobState.failed(JobFailure.fromPrimitive(data.failure));
      default:
        return QueueJobState.create({ state: data.state });
    }
  }

  private static ensureStateIsKnown(state: string): asserts state is QueueStateName {
    if (!STATES.includes(state as QueueStateName)) throw new InvalidQueueJobStateError(state);
  }

  applyTo(job: SeparationJob): SeparationJob {
    switch (this.value.state) {
      case "active":
        return job.recordProgress(this.value.stage, this.value.progress);
      case "completed":
        return job.complete(this.value.result);
      case "failed":
        return job.fail(this.value.failure);
      case "missing":
        return job.markAsLost();
      case "pending":
        return job;
    }
  }

  equals(other: QueueJobState): boolean {
    const mine = this.value;
    const theirs = other.value;
    if (mine.state === "active" && theirs.state === "active") {
      return mine.stage.equals(theirs.stage) && mine.progress.equals(theirs.progress);
    }
    if (mine.state === "completed" && theirs.state === "completed") return mine.result.equals(theirs.result);
    if (mine.state === "failed" && theirs.state === "failed") return mine.failure.equals(theirs.failure);
    return mine.state === theirs.state;
  }

  toPrimitive(): QueueJobStatePrimitive {
    switch (this.value.state) {
      case "active":
        return { state: "active", stage: this.value.stage.toPrimitive(), progress: this.value.progress.toPrimitive() };
      case "completed":
        return { state: "completed", result: this.value.result.toPrimitive() };
      case "failed":
        return { state: "failed", failure: this.value.failure.toPrimitive() };
      default:
        return { state: this.value.state };
    }
  }
}
