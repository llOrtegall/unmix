import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class UnsupportedMediaTypeError extends ValidationError {
  readonly code = "track.unsupported_media_type";

  constructor(contentType: string) {
    super(`Files of type ${contentType} are not supported`);
  }
}
