import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidJobReferenceError extends ValidationError {
  readonly code = "track.invalid_job_reference";

  constructor(value: string) {
    super(`"${value}" is not a valid job id`);
  }
}
