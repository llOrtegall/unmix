import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidUrlLifetimeError extends ValidationError {
  readonly code = "storage.invalid_url_lifetime";

  constructor(seconds: number) {
    super(`${seconds} is not a valid URL lifetime`);
  }
}
