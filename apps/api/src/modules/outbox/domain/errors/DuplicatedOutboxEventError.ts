import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class DuplicatedOutboxEventError extends ValidationError {
  readonly code = "outbox.duplicated_event";

  constructor(id: string) {
    super(`Outbox event ${id} appears twice`);
  }
}
