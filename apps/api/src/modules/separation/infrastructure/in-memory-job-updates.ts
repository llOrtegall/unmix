import { EventEmitter } from "node:events";
import type { JobUpdates, JobView } from "../application/ports/index.ts";

/** Per-process fan-out. Each API instance receives every queue event, so this scales out. */
export class InMemoryJobUpdates implements JobUpdates {
  #emitter = new EventEmitter().setMaxListeners(0);

  publish(job: JobView): void {
    this.#emitter.emit(job.id, job);
  }

  subscribe(jobId: string, listener: (job: JobView) => void): () => void {
    this.#emitter.on(jobId, listener);
    return () => this.#emitter.off(jobId, listener);
  }
}
