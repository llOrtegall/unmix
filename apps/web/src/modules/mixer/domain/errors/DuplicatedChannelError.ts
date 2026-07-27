import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class DuplicatedChannelError extends ValidationError {
  readonly code = "mixer.duplicated_channel";

  constructor(name: string) {
    super(`The ${name} channel appears more than once`);
  }
}
