import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class FileTooLargeError extends ValidationError {
  readonly code = "track.file_too_large";

  constructor(limitMegabytes: number) {
    super(`The file is over the ${limitMegabytes} MB limit`);
  }
}
