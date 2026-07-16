import { NotFoundError } from "../../../shared/domain/DomainError.ts";

export class TrackNotFoundError extends NotFoundError {
  readonly code = "track.not_found";

  constructor(id: string) {
    super(`Track ${id} not found`);
  }
}
