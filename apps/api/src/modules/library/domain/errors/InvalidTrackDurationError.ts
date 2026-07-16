import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidTrackDurationError extends ValidationError {
  readonly code = "track.invalid_duration";

  constructor(seconds: number) {
    super(`${seconds} is not a valid duration`);
  }
}
