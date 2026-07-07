import type { AppError } from "../../../../shared/kernel/errors.ts";
import type { Clock, EventPublisher, IdGenerator, TransactionManager } from "../../../../shared/kernel/ports.ts";
import { err, ok, type Result } from "../../../../shared/kernel/result.ts";
import { SeparationJob } from "../../domain/separation-job.ts";
import type { JobRepository, JobUpdates, JobView, TrackCatalog } from "../ports/index.ts";

export class RequestSeparation {
  #deps: RequestSeparationDeps;

  constructor(deps: RequestSeparationDeps) {
    this.#deps = deps;
  }

  async execute(trackId: string, userId: string): Promise<Result<JobView, AppError>> {
    const { jobs, catalog, events, tx, updates, ids, clock, model } = this.#deps;
    const result = await tx.run(async (): Promise<Result<JobView, AppError>> => {
      const track = await catalog.getSeparableTrack(trackId, userId);
      if (track.isErr()) return err(track.error);

      const job = SeparationJob.request({
        id: ids.next(),
        eventId: ids.next(),
        ...track.value,
        model,
        now: clock.now(),
      });
      await jobs.save(job);
      await events.publish(job.pullEvents());
      return ok(job.toSnapshot());
    });
    if (result.isOk()) updates.publish(result.value);
    return result;
  }
}

export interface RequestSeparationDeps {
  jobs: JobRepository;
  catalog: TrackCatalog;
  events: EventPublisher;
  tx: TransactionManager;
  updates: JobUpdates;
  ids: IdGenerator;
  clock: Clock;
  model: string;
}
