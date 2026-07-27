import type { Unsubscribe } from "../../shared/domain/Unsubscribe.ts";
import { JobNotFoundError } from "../domain/errors/JobNotFoundError.ts";
import type { JobEventsRepository } from "../domain/JobEventsRepository.ts";
import { JobId } from "../domain/JobId.ts";
import type { JobListener } from "../domain/JobListener.ts";
import type { JobRepository } from "../domain/JobRepository.ts";

const NOT_WATCHING: Unsubscribe = () => {};

// Reads the job first: the event stream of an unknown job answers 404, which EventSource cannot see.
export const watchJob =
  ({ jobRepository, jobEventsRepository }: { jobRepository: JobRepository; jobEventsRepository: JobEventsRepository }) =>
  async (id: string, listener: JobListener): Promise<Unsubscribe> => {
    const jobId = JobId.fromPrimitive(id);
    const job = await jobRepository.findById(jobId);
    if (!job) throw new JobNotFoundError(id);

    listener.onUpdate(job);
    return job.isFinished() ? NOT_WATCHING : jobEventsRepository.watch(jobId, listener);
  };
