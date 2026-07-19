import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidEventTypeError extends ValidationError {
  readonly code = "outbox.invalid_event_type";

  constructor(value: string) {
    super(`"${value}" is not an event type`);
  }
}
