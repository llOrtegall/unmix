import { ConflictError } from "../../../shared/domain/DomainError.ts";

export class UploadMissingError extends ConflictError {
  readonly code = "track.upload_missing";

  constructor(id: string) {
    super(`The file of track ${id} has not been uploaded yet`);
  }
}
