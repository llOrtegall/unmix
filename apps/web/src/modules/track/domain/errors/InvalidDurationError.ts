import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidDurationError extends ValidationError {
  readonly code = "track.invalid_duration";

  constructor(seconds: number) {
    super(`${seconds} s is not a valid duration`);
  }
}
