import { DomainError } from "../../../shared/domain/DomainError.ts";

export class UploadCancelledError extends DomainError {
  readonly code = "upload.cancelled";

  constructor() {
    super("The upload was cancelled");
  }
}
