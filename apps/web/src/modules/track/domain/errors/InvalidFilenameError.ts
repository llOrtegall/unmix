import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidFilenameError extends ValidationError {
  readonly code = "track.invalid_filename";

  constructor() {
    super("The file has no name");
  }
}
