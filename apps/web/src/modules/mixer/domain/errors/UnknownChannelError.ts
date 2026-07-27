import { NotFoundError } from "../../../shared/domain/DomainError.ts";

export class UnknownChannelError extends NotFoundError {
  readonly code = "mixer.unknown_channel";

  constructor(name: string) {
    super(`The mix has no ${name} channel`);
  }
}
