import type { JobId } from "../../shared/domain/JobId.ts";
import type { SeparationJob } from "./SeparationJob.ts";

export type JobListener = (job: SeparationJob) => void;

export type Unsubscribe = () => void;

export interface JobUpdatesRepository {
  publish(job: SeparationJob): void;
  subscribe(id: JobId, listener: JobListener): Unsubscribe;
}
