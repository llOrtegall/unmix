import { ValidationError } from "../DomainError.ts";

export class InvalidCreatedAtError extends ValidationError {
  readonly code = "date.invalid_created_at";

  constructor(value: string) {
    super(`"${value}" is not a valid date`);
  }
}
