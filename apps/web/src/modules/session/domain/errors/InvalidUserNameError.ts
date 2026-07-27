import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidUserNameError extends ValidationError {
  readonly code = "session.invalid_user_name";

  constructor() {
    super("The user name is empty");
  }
}
