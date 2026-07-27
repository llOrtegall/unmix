import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidTrackIdError extends ValidationError {
  readonly code = "track.invalid_id";

  constructor(value: string) {
    super(`"${value}" is not a valid track id`);
  }
}
