import type { TrackId } from "../../track/domain/TrackId.ts";
import type { Job } from "./Job.ts";
import type { JobId } from "./JobId.ts";

export interface JobRepository {
  findById(id: JobId): Promise<Job | null>;
  request(trackId: TrackId): Promise<Job>;
}
