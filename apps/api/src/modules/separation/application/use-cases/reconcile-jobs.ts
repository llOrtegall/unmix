import type { JobRepository, QueueInspector } from "../ports/index.ts";
import type { JobLifecycle } from "./job-lifecycle.ts";

/**
 * Catches up on queue events missed while the API was down: compares every
 * unfinished job with its state in the queue.
 */
export class ReconcileJobs {
  #jobs: JobRepository;
  #queue: QueueInspector;
  #lifecycle: JobLifecycle;

  constructor(deps: { jobs: JobRepository; queue: QueueInspector; lifecycle: JobLifecycle }) {
    this.#jobs = deps.jobs;
    this.#queue = deps.queue;
    this.#lifecycle = deps.lifecycle;
  }

  async execute(): Promise<{ checked: number }> {
    const unfinished = await this.#jobs.findUnfinished();
    for (const job of unfinished) {
      const state = await this.#queue.inspect(job.id);
      switch (state.state) {
        case "active":
          if (state.stage) await this.#lifecycle.recordProgress(job.id, state.stage, state.progress);
          break;
        case "completed":
          await this.#lifecycle.complete(job.id, state.result);
          break;
        case "failed":
          await this.#lifecycle.fail(job.id, state.failure);
          break;
        case "missing":
          // Queued jobs may still sit in the outbox; only processing jobs are truly lost.
          if (job.toSnapshot().status === "processing") {
            await this.#lifecycle.fail(job.id, { code: "SEPARATION_ERROR", message: "Job lost from the queue." });
          }
          break;
        case "pending":
          break;
      }
    }
    return { checked: unfinished.length };
  }
}
