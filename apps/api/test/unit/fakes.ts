import type { DomainEvent } from "../../src/shared/kernel/domain-event.ts";
import type { Clock, EventPublisher, IdGenerator, TransactionManager } from "../../src/shared/kernel/ports.ts";
import { err, ok } from "../../src/shared/kernel/result.ts";
import type { JobRepository, JobUpdates, JobView, TrackCatalog } from "../../src/modules/separation/application/ports/index.ts";
import { SeparationJob } from "../../src/modules/separation/domain/separation-job.ts";

export const clock: Clock = { now: () => new Date("2026-07-01T12:00:00Z") };

export function sequentialIds(prefix = "id"): IdGenerator {
  let n = 0;
  return { next: () => `${prefix}-${++n}` };
}

export const passthroughTx: TransactionManager = { run: (work) => work() };

export class RecordingPublisher implements EventPublisher {
  events: DomainEvent[] = [];
  async publish(events: DomainEvent[]) {
    this.events.push(...events);
  }
}

export class InMemoryJobs implements JobRepository {
  rows = new Map<string, JobView>();
  async findById(id: string) {
    const row = this.rows.get(id);
    return row ? SeparationJob.restore({ ...row }) : null;
  }
  async save(job: SeparationJob) {
    this.rows.set(job.id, job.toSnapshot());
  }
  async findUnfinished() {
    return [...this.rows.values()]
      .filter((r) => r.status === "queued" || r.status === "processing")
      .map((r) => SeparationJob.restore({ ...r }));
  }
}

export class RecordingUpdates implements JobUpdates {
  published: JobView[] = [];
  publish(job: JobView) {
    this.published.push(job);
  }
  subscribe() {
    return () => {};
  }
}

export function catalog(ready: boolean): TrackCatalog {
  return {
    getSeparableTrack: async (trackId) =>
      ready
        ? ok({ trackId, inputKey: `tracks/${trackId}/original.mp3`, outputPrefix: `tracks/${trackId}/stems` })
        : err({ code: "UPLOAD_MISSING", message: "not uploaded" }),
  };
}
