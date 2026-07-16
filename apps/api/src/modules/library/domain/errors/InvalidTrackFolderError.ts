import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class InvalidTrackFolderError extends ValidationError {
  readonly code = "track.invalid_folder";

  constructor(key: string) {
    super(`"${key}" is not a track folder`);
  }
}
