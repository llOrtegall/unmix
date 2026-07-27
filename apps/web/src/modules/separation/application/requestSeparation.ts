import { TrackId } from "../../track/domain/TrackId.ts";
import type { Job } from "../domain/Job.ts";
import type { JobRepository } from "../domain/JobRepository.ts";

export const requestSeparation =
  ({ jobRepository }: { jobRepository: JobRepository }) =>
  (trackId: string): Promise<Job> =>
    jobRepository.request(TrackId.fromPrimitive(trackId));
