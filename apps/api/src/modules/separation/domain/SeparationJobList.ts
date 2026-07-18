import { DuplicatedJobError } from "./errors/DuplicatedJobError.ts";
import { SeparationJob, type SeparationJobPrimitive } from "./SeparationJob.ts";

export type SeparationJobListPrimitive = readonly SeparationJobPrimitive[];

export class SeparationJobList {
  private readonly jobs: readonly SeparationJob[];

  private constructor(jobs: readonly SeparationJob[]) {
    this.jobs = jobs;
  }

  static create(jobs: readonly SeparationJob[]): SeparationJobList {
    SeparationJobList.ensureHasNoDuplicates(jobs);
    return new SeparationJobList([...jobs]);
  }

  static empty(): SeparationJobList {
    return SeparationJobList.create([]);
  }

  static fromPrimitive(data: SeparationJobListPrimitive): SeparationJobList {
    return SeparationJobList.create(data.map(SeparationJob.fromPrimitive));
  }

  private static ensureHasNoDuplicates(jobs: readonly SeparationJob[]): void {
    const ids = jobs.map((job) => job.getId().toPrimitive());
    const duplicated = ids.find((id, index) => ids.indexOf(id) !== index);
    if (duplicated) throw new DuplicatedJobError(duplicated);
  }

  map<T>(transform: (job: SeparationJob) => T): T[] {
    return this.jobs.map(transform);
  }

  count(): number {
    return this.jobs.length;
  }

  isEmpty(): boolean {
    return this.jobs.length === 0;
  }

  equals(other: SeparationJobList): boolean {
    return this.count() === other.count() && this.jobs.every((job, index) => other.jobs[index]?.equals(job));
  }

  toPrimitive(): SeparationJobListPrimitive {
    return this.jobs.map((job) => job.toPrimitive());
  }
}
