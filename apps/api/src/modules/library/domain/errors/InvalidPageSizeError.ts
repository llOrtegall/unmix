import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidPageSizeError extends ValidationError {
  readonly code = "track.invalid_page_size";

  constructor(size: number) {
    super(`${size} is not a valid page size`);
  }
}
