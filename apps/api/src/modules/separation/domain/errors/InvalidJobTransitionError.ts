import { ConflictError } from "../../../shared/domain/DomainError.ts";

export class InvalidJobTransitionError extends ConflictError {
  readonly code = "job.invalid_transition";

  constructor(id: string, from: string, to: string) {
    super(`Job ${id} cannot go from ${from} to ${to}`);
  }
}
