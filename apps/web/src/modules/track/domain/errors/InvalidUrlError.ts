import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidUrlError extends ValidationError {
  readonly code = "track.invalid_url";

  constructor(value: string) {
    super(`"${value}" is not a valid URL`);
  }
}
