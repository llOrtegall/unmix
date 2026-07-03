import type { Clock, EventPublisher, IdGenerator, TransactionManager } from "../../../../shared/kernel/ports.ts";
import { ok, type Result } from "../../../../shared/kernel/result.ts";
import type { SeparationError } from "../../domain/errors.ts";
import type { JobFailure, SeparationJob, SeparationResult, Stage } from "../../domain/separation-job.ts";
import type { JobRepository, JobUpdates } from "../ports/index.ts";

export interface JobLifecycleDeps {
  jobs: JobRepository;
  events: EventPublisher;
  tx: TransactionManager;
  updates: JobUpdates;
  ids: IdGenerator;
  clock: Clock;
}

/**
 * Applies worker outcomes to jobs. Every method is idempotent: queue events can
 * arrive twice or out of order, and unknown jobs are ignored.
 */
export class JobLifecycle {
  #d: JobLifecycleDeps;

  constructor(deps: JobLifecycleDeps) {
    this.#d = deps;
  }

  async recordProgress(jobId: string, stage: Stage, progress: number): Promise<void> {
    const job = await this.#d.jobs.findById(jobId);
    if (!job || !job.recordProgress(stage, progress)) return;
    await this.#d.jobs.save(job);
    this.#d.updates.publish(job.toSnapshot());
  }

  complete(jobId: string, result: Omit<SeparationResult, "jobId" | "trackId">) {
    return this.#transition(jobId, (job) => job.complete(result, this.#d.ids.next(), this.#d.clock.now()));
  }

  fail(jobId: string, failure: JobFailure) {
    return this.#transition(jobId, (job) => job.fail(failure, this.#d.ids.next(), this.#d.clock.now()));
  }

  async #transition(
    jobId: string,
    change: (job: SeparationJob) => Result<boolean, SeparationError>,
  ): Promise<Result<void, SeparationError>> {
    let changed: SeparationJob | null = null;
    const result = await this.#d.tx.run(async (): Promise<Result<void, SeparationError>> => {
      const job = await this.#d.jobs.findById(jobId);
      if (!job) return ok(undefined);
      const outcome = change(job);
      if (outcome.isErr()) return outcome.map(() => undefined);
      if (!outcome.value) return ok(undefined);
      await this.#d.jobs.save(job);
      await this.#d.events.publish(job.pullEvents());
      changed = job;
      return ok(undefined);
    });
    if (changed) this.#d.updates.publish((changed as SeparationJob).toSnapshot());
    return result;
  }
}
