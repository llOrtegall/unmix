import { DomainError } from "../../../shared/domain/DomainError.ts";

export class SignInFailedError extends DomainError {
  readonly code = "session.sign_in_failed";

  constructor() {
    super("Google sign-in failed");
  }
}
