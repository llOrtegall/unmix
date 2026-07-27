import { DomainError } from "../../../shared/domain/DomainError.ts";

export class UploadFailedError extends DomainError {
  readonly code = "upload.failed";

  constructor(status: number) {
    super(`The upload failed with status ${status}`);
  }
}
