import type { EventRepository } from "../../shared/domain/EventRepository.ts";
import { JobId } from "../../shared/domain/JobId.ts";
import type { TransactionRepository } from "../../shared/domain/TransactionRepository.ts";
import type { JobRepository } from "../domain/JobRepository.ts";
import type { JobUpdatesRepository } from "../domain/JobUpdatesRepository.ts";
import { Progress } from "../domain/Progress.ts";
import { QueueJobState } from "../domain/QueueJobState.ts";
import type { SeparationJob } from "../domain/SeparationJob.ts";
import { Stage } from "../domain/Stage.ts";
import { applyQueueState } from "./applyQueueState.ts";

export interface RecordJobProgressInput {
  readonly jobId: string;
  readonly stage: string;
  readonly progress: number;
}

interface Dependencies {
  readonly jobRepository: JobRepository;
  readonly eventRepository: EventRepository;
  readonly transactionRepository: TransactionRepository;
  readonly jobUpdatesRepository: JobUpdatesRepository;
}

export const recordJobProgress = ({ transactionRepository, jobUpdatesRepository, ...dependencies }: Dependencies) => {
  const apply = applyQueueState(dependencies);

  return async (input: RecordJobProgressInput): Promise<SeparationJob> => {
    const state = QueueJobState.active(Stage.create(input.stage), Progress.create(input.progress));
    const job = await transactionRepository.run(() => apply(JobId.fromPrimitive(input.jobId), state));
    jobUpdatesRepository.publish(job);
    return job;
  };
};
