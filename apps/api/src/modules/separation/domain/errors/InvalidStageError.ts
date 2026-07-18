import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidStageError extends ValidationError {
  readonly code = "job.invalid_stage";

  constructor(value: string) {
    super(`"${value}" is not a separation stage`);
  }
}
