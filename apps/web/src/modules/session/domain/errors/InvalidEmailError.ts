import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidEmailError extends ValidationError {
  readonly code = "session.invalid_email";

  constructor(value: string) {
    super(`"${value}" is not a valid email`);
  }
}
