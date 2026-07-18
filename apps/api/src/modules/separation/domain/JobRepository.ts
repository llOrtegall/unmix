import type { JobId } from "../../shared/domain/JobId.ts";
import type { SeparationJob } from "./SeparationJob.ts";
import type { SeparationJobList } from "./SeparationJobList.ts";

export interface JobRepository {
  save(job: SeparationJob): Promise<void>;
  findById(id: JobId): Promise<SeparationJob | null>;
  findByIdForUpdate(id: JobId): Promise<SeparationJob | null>;
  findUnfinished(): Promise<SeparationJobList>;
}
