import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidSeparationResultError extends ValidationError {
  readonly code = "job.invalid_result";

  constructor(reason: string) {
    super(`Invalid separation result: ${reason}`);
  }
}
