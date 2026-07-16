import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidTrackTitleError extends ValidationError {
  readonly code = "track.invalid_title";

  constructor(reason: string) {
    super(`Invalid track title: ${reason}`);
  }
}
