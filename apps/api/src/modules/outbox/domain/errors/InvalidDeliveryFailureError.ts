import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidDeliveryFailureError extends ValidationError {
  readonly code = "outbox.invalid_failure";

  constructor(reason: string) {
    super(`Invalid delivery failure: ${reason}`);
  }
}
