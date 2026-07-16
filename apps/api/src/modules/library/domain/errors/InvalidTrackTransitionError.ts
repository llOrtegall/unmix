import { ConflictError } from "../../../shared/domain/DomainError.ts";

export class InvalidTrackTransitionError extends ConflictError {
  readonly code = "track.invalid_transition";

  constructor(id: string, from: string, to: string) {
    super(`Track ${id} cannot go from ${from} to ${to}`);
  }
}
