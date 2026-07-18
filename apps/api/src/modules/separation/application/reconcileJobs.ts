import type { EventRepository } from "../../shared/domain/EventRepository.ts";
import type { TransactionRepository } from "../../shared/domain/TransactionRepository.ts";
import type { JobRepository } from "../domain/JobRepository.ts";
import type { JobUpdatesRepository } from "../domain/JobUpdatesRepository.ts";
import type { QueueRepository } from "../domain/QueueRepository.ts";
import { syncJob } from "./syncJob.ts";

export interface ReconcileReport {
  readonly checked: number;
}

interface Dependencies {
  readonly jobRepository: JobRepository;
  readonly eventRepository: EventRepository;
  readonly transactionRepository: TransactionRepository;
  readonly jobUpdatesRepository: JobUpdatesRepository;
  readonly queueRepository: QueueRepository;
}

// BullMQ does not replay the queue events that happened while the API was down.
export const reconcileJobs = (dependencies: Dependencies) => {
  const sync = syncJob(dependencies);

  return async (): Promise<ReconcileReport> => {
    const unfinished = await dependencies.jobRepository.findUnfinished();
    for (const jobId of unfinished.map((job) => job.getId().toPrimitive())) await sync(jobId);
    return { checked: unfinished.count() };
  };
};
