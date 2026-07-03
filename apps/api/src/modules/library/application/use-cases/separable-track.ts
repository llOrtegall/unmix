import { err, ok, type Result } from "../../../../shared/kernel/result.ts";
import { type LibraryError, libraryError } from "../../domain/errors.ts";
import type { ObjectStorage, TrackRepository } from "../ports/index.ts";

export interface SeparableTrack {
  trackId: string;
  inputKey: string;
  outputPrefix: string;
}

/** Public query for the separation module: is this track ready to be separated? */
export class GetSeparableTrack {
  #tracks: TrackRepository;
  #storage: ObjectStorage;

  constructor(deps: { tracks: TrackRepository; storage: ObjectStorage }) {
    this.#tracks = deps.tracks;
    this.#storage = deps.storage;
  }

  async execute(trackId: string): Promise<Result<SeparableTrack, LibraryError>> {
    const track = await this.#tracks.findById(trackId);
    if (!track) return err(libraryError("TRACK_NOT_FOUND", "Track not found."));
    const allowed = track.canStartSeparation();
    if (allowed.isErr()) return err(allowed.error);
    const t = track.toSnapshot();
    if (!(await this.#storage.exists(t.inputKey))) {
      return err(libraryError("UPLOAD_MISSING", "The file has not been uploaded yet."));
    }
    return ok({ trackId: t.id, inputKey: t.inputKey, outputPrefix: track.stemsPrefix });
  }
}
