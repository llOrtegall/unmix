import type { EventRepository } from "../../shared/domain/EventRepository.ts";
import type { JobId } from "../../shared/domain/JobId.ts";
import { JobNotFoundError } from "../domain/errors/JobNotFoundError.ts";
import type { JobRepository } from "../domain/JobRepository.ts";
import type { QueueJobState } from "../domain/QueueJobState.ts";
import type { SeparationJob } from "../domain/SeparationJob.ts";

interface Dependencies {
  readonly jobRepository: JobRepository;
  readonly eventRepository: EventRepository;
}

// The row lock serializes queue events about the same job, so a late progress never overwrites an outcome.
export const applyQueueState =
  ({ jobRepository, eventRepository }: Dependencies) =>
  async (jobId: JobId, state: QueueJobState): Promise<SeparationJob> => {
    const job = await jobRepository.findByIdForUpdate(jobId);
    if (!job) throw new JobNotFoundError(jobId.toPrimitive());
    const updated = state.applyTo(job);
    await jobRepository.save(updated);
    await eventRepository.publish(updated.getEvents());
    return updated;
  };
