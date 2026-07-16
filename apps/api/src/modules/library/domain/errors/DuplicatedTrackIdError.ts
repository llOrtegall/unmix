import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class DuplicatedTrackIdError extends ValidationError {
  readonly code = "track.duplicated_id";

  constructor(id: string) {
    super(`Track ${id} appears more than once`);
  }
}
