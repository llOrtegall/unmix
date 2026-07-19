import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidEventPayloadError extends ValidationError {
  readonly code = "outbox.invalid_payload";

  constructor(reason: string) {
    super(`Invalid event payload: ${reason}`);
  }
}
