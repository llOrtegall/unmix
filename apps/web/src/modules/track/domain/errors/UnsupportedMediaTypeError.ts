import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class UnsupportedMediaTypeError extends ValidationError {
  readonly code = "track.unsupported_media_type";

  constructor(type: string) {
    super(`${type || "This file"} is not a supported audio or video type`);
  }
}
