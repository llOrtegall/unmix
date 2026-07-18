import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidModelNameError extends ValidationError {
  readonly code = "job.invalid_model";

  constructor(value: string) {
    super(`"${value}" is not a supported separation model`);
  }
}
