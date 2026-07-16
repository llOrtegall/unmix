import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidCreditError extends ValidationError {
  readonly code = "track.invalid_credit";

  constructor(reason: string) {
    super(`Invalid credit: ${reason}`);
  }
}
