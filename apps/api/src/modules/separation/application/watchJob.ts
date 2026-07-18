import type { JobListener, JobUpdatesRepository, Unsubscribe } from "../domain/JobUpdatesRepository.ts";
import type { JobRepository } from "../domain/JobRepository.ts";
import type { SeparationJob } from "../domain/SeparationJob.ts";
import type { TrackCatalogRepository } from "../domain/TrackCatalogRepository.ts";
import { findJob } from "./findJob.ts";

export interface JobWatch {
  readonly job: SeparationJob;
  readonly stop: Unsubscribe;
}

interface Dependencies {
  readonly jobRepository: JobRepository;
  readonly trackCatalogRepository: TrackCatalogRepository;
  readonly jobUpdatesRepository: JobUpdatesRepository;
}

export const watchJob = ({ jobRepository, trackCatalogRepository, jobUpdatesRepository }: Dependencies) => {
  const find = findJob({ jobRepository, trackCatalogRepository });

  return async (jobId: string, userId: string, listener: JobListener): Promise<JobWatch> => {
    const job = await find(jobId, userId);
    return { job, stop: jobUpdatesRepository.subscribe(job.getId(), listener) };
  };
};
