import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class DuplicatedTrackError extends ValidationError {
  readonly code = "track.duplicated_track";

  constructor(id: string) {
    super(`Track ${id} appears more than once`);
  }
}
