import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class DuplicatedStemError extends ValidationError {
  readonly code = "stem.duplicated";

  constructor(name: string) {
    super(`Stem ${name} appears more than once`);
  }
}
