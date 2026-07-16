import { ConflictError } from "../../../shared/domain/DomainError.ts";

export class TrackBusyError extends ConflictError {
  readonly code = "track.busy";

  constructor(id: string) {
    super(`Track ${id} is being separated`);
  }
}
