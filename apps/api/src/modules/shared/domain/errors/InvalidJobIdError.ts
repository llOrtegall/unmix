import { ValidationError } from "../DomainError.ts";

export class InvalidJobIdError extends ValidationError {
  readonly code = "job.invalid_id";

  constructor(value: string) {
    super(`"${value}" is not a valid job id`);
  }
}
