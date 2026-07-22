import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidSessionCookiesError extends ValidationError {
  readonly code = "session.invalid_cookies";

  constructor(reason: string) {
    super(`Invalid session cookies: ${reason}`);
  }
}
