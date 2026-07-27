import type { DomainError } from "../../shared/domain/DomainError.ts";
import type { Job } from "./Job.ts";

export interface JobListener {
  onUpdate(job: Job): void;
  onError(error: DomainError): void;
}
