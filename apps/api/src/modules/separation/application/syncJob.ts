import type { EventRepository } from "../../shared/domain/EventRepository.ts";
import { JobId } from "../../shared/domain/JobId.ts";
import type { TransactionRepository } from "../../shared/domain/TransactionRepository.ts";
import type { JobRepository } from "../domain/JobRepository.ts";
import type { JobUpdatesRepository } from "../domain/JobUpdatesRepository.ts";
import type { QueueRepository } from "../domain/QueueRepository.ts";
import type { SeparationJob } from "../domain/SeparationJob.ts";
import { applyQueueState } from "./applyQueueState.ts";

interface Dependencies {
  readonly jobRepository: JobRepository;
  readonly eventRepository: EventRepository;
  readonly transactionRepository: TransactionRepository;
  readonly jobUpdatesRepository: JobUpdatesRepository;
  readonly queueRepository: QueueRepository;
}

// A failed attempt may still be retried, so outcomes are read from the queue instead of trusting the event.
export const syncJob = ({ queueRepository, transactionRepository, jobUpdatesRepository, ...dependencies }: Dependencies) => {
  const apply = applyQueueState(dependencies);

  return async (jobId: string): Promise<SeparationJob> => {
    const id = JobId.fromPrimitive(jobId);
    const state = await queueRepository.findState(id);
    const job = await transactionRepository.run(() => apply(id, state));
    jobUpdatesRepository.publish(job);
    return job;
  };
};
