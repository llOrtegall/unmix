import { ValidationError } from "../DomainError.ts";

export class UnexpectedEventTypeError extends ValidationError {
  readonly code = "event.unexpected_type";

  constructor(expected: string, actual: string) {
    super(`Expected a ${expected} event, got ${actual}`);
  }
}
