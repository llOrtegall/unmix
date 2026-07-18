import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidSeparationJobError extends ValidationError {
  readonly code = "job.invalid_state";

  constructor(id: string, reason: string) {
    super(`Job ${id} is inconsistent: ${reason}`);
  }
}
