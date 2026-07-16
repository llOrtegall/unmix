import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidTrackStatusError extends ValidationError {
  readonly code = "track.invalid_status";

  constructor(value: string) {
    super(`"${value}" is not a track status`);
  }
}
