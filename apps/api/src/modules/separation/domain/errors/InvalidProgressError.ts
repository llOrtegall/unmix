import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidProgressError extends ValidationError {
  readonly code = "job.invalid_progress";

  constructor(value: number) {
    super(`${value} is not a percentage`);
  }
}
