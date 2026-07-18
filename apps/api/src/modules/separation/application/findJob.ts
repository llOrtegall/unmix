import { JobId } from "../../shared/domain/JobId.ts";
import { UserId } from "../../shared/domain/UserId.ts";
import { JobNotFoundError } from "../domain/errors/JobNotFoundError.ts";
import type { JobRepository } from "../domain/JobRepository.ts";
import type { SeparationJob } from "../domain/SeparationJob.ts";
import type { TrackCatalogRepository } from "../domain/TrackCatalogRepository.ts";

interface Dependencies {
  readonly jobRepository: JobRepository;
  readonly trackCatalogRepository: TrackCatalogRepository;
}

// Jobs of someone else's track read as missing, so ids never leak across users.
export const findJob =
  ({ jobRepository, trackCatalogRepository }: Dependencies) =>
  async (jobId: string, userId: string): Promise<SeparationJob> => {
    const job = await jobRepository.findById(JobId.fromPrimitive(jobId));
    if (!job || !(await trackCatalogRepository.isOwnedBy(job.getTrackId(), UserId.fromPrimitive(userId)))) {
      throw new JobNotFoundError(jobId);
    }
    return job;
  };
