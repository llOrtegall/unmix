import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidArchiveEntryError extends ValidationError {
  readonly code = "archive.invalid_entry";

  constructor(reason: string) {
    super(`Invalid archive entry: ${reason}`);
  }
}
