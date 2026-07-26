import { DomainError } from "../DomainError.ts";

export class SessionExpiredError extends DomainError {
  readonly code = "session.required";

  constructor() {
    super("The session has expired");
  }
}
