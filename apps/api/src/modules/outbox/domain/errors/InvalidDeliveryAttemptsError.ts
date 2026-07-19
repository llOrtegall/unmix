import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidDeliveryAttemptsError extends ValidationError {
  readonly code = "outbox.invalid_attempts";

  constructor(value: number) {
    super(`${value} is not a number of delivery attempts`);
  }
}
