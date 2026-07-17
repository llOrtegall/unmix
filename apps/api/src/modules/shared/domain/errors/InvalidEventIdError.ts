import { ValidationError } from "../DomainError.ts";

export class InvalidEventIdError extends ValidationError {
  readonly code = "event.invalid_id";

  constructor(value: string) {
    super(`"${value}" is not a valid event id`);
  }
}
