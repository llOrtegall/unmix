import { ValidationError } from "../DomainError.ts";

export class DuplicatedEventError extends ValidationError {
  readonly code = "event.duplicated";

  constructor(id: string) {
    super(`Event ${id} is recorded twice`);
  }
}
