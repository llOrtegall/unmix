import { ValidationError } from "../DomainError.ts";

export class InvalidOccurredAtError extends ValidationError {
  readonly code = "event.invalid_occurred_at";

  constructor(value: string) {
    super(`"${value}" is not a valid date`);
  }
}
