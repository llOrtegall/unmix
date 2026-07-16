import { ConflictError } from "../../../shared/domain/DomainError.ts";

export class StemsNotReadyError extends ConflictError {
  readonly code = "track.stems_not_ready";

  constructor(id: string) {
    super(`The stems of track ${id} are not ready yet`);
  }
}
