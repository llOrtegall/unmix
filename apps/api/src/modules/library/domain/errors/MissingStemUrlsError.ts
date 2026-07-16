import { ValidationError } from "../../../shared/domain/DomainError.ts";

export class MissingStemUrlsError extends ValidationError {
  readonly code = "track.missing_stem_urls";

  constructor(trackId: string) {
    super(`Track ${trackId} has stems without signed URLs`);
  }
}
