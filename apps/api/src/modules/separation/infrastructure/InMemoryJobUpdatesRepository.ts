import { EventEmitter } from "node:events";
import type { JobId } from "../../shared/domain/JobId.ts";
import type { JobListener, JobUpdatesRepository, Unsubscribe } from "../domain/JobUpdatesRepository.ts";
import type { SeparationJob } from "../domain/SeparationJob.ts";

// Per-process fan-out: every API instance receives every queue event, so this scales out.
export class InMemoryJobUpdatesRepository implements JobUpdatesRepository {
  private readonly emitter = new EventEmitter().setMaxListeners(0);

  publish(job: SeparationJob): void {
    this.emitter.emit(job.getId().toPrimitive(), job);
  }

  subscribe(id: JobId, listener: JobListener): Unsubscribe {
    const key = id.toPrimitive();
    this.emitter.on(key, listener);
    return () => {
      this.emitter.off(key, listener);
    };
  }
}
