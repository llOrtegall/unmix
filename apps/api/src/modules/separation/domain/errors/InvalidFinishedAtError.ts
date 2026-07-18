import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidFinishedAtError extends ValidationError {
  readonly code = "job.invalid_finished_at";

  constructor(value: string) {
    super(`"${value}" is not a valid date`);
  }
}
