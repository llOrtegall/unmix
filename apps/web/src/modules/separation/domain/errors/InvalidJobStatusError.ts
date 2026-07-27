import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidJobStatusError extends ValidationError {
  readonly code = "job.invalid_status";

  constructor(value: string) {
    super(`"${value}" is not a job status`);
  }
}
