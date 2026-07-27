import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidJobFailureError extends ValidationError {
  readonly code = "job.invalid_failure";

  constructor(reason: string) {
    super(`Invalid job failure: ${reason}`);
  }
}
