import type { Result } from "../../../../shared/kernel/result.ts";
import type { SeparationJob, SeparationJobProps, Stage, SeparationResult, JobFailure } from "../../domain/separation-job.ts";

export interface JobRepository {
  findById(id: string): Promise<SeparationJob | null>;
  save(job: SeparationJob): Promise<void>;
  findUnfinished(): Promise<SeparationJob[]>;
}

/** What the separation module needs from the library module (implemented via its public API). */
export interface TrackCatalog {
  getSeparableTrack(
    trackId: string,
  ): Promise<Result<{ trackId: string; inputKey: string; outputPrefix: string }, { code: string; message: string }>>;
}

/** Latest known state of a job in the queue, used to reconcile after downtime. */
export type QueueJobState =
  | { state: "pending" }
  | { state: "active"; stage: Stage | null; progress: number }
  | { state: "completed"; result: Omit<SeparationResult, "jobId" | "trackId"> }
  | { state: "failed"; failure: JobFailure }
  | { state: "missing" };

export interface QueueInspector {
  inspect(jobId: string): Promise<QueueJobState>;
}

export type JobView = Readonly<SeparationJobProps>;

/** Fan-out of job changes to live listeners (SSE). Only called after a commit. */
export interface JobUpdates {
  publish(job: JobView): void;
  subscribe(jobId: string, listener: (job: JobView) => void): () => void;
}
