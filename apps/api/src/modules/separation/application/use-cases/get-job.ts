import { err, ok, type Result } from "../../../../shared/kernel/result.ts";
import { type SeparationError, separationError } from "../../domain/errors.ts";
import type { JobRepository, JobView } from "../ports/index.ts";

export class GetJob {
  #jobs: JobRepository;

  constructor(deps: { jobs: JobRepository }) {
    this.#jobs = deps.jobs;
  }

  async execute(jobId: string): Promise<Result<JobView, SeparationError>> {
    const job = await this.#jobs.findById(jobId);
    return job ? ok(job.toSnapshot()) : err(separationError("JOB_NOT_FOUND", "Job not found."));
  }
}
