import { err, ok, type Result } from "../../../../shared/kernel/result.ts";
import { type SeparationError, separationError } from "../../domain/errors.ts";
import type { JobRepository, JobView, TrackCatalog } from "../ports/index.ts";

export class GetJob {
  #jobs: JobRepository;
  #catalog: TrackCatalog;

  constructor(deps: { jobs: JobRepository; catalog: TrackCatalog }) {
    this.#jobs = deps.jobs;
    this.#catalog = deps.catalog;
  }

  /** Jobs of someone else's track read as missing. */
  async execute(jobId: string, userId: string): Promise<Result<JobView, SeparationError>> {
    const job = (await this.#jobs.findById(jobId))?.toSnapshot();
    if (!job || !(await this.#catalog.isOwnedBy(job.trackId, userId))) {
      return err(separationError("JOB_NOT_FOUND", "Job not found."));
    }
    return ok(job);
  }
}
