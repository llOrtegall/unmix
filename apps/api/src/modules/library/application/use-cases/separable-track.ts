import { err, ok, type Result } from "../../../../shared/kernel/result.ts";
import { type LibraryError, libraryError } from "../../domain/errors.ts";
import type { ObjectStorage, TrackRepository } from "../ports/index.ts";
import { findOwnedTrack } from "./find-owned-track.ts";

export interface SeparableTrack {
  trackId: string;
  inputKey: string;
  outputPrefix: string;
}

/** Public query for the separation module: may this user separate this track now? */
export class GetSeparableTrack {
  #tracks: TrackRepository;
  #storage: ObjectStorage;

  constructor(deps: { tracks: TrackRepository; storage: ObjectStorage }) {
    this.#tracks = deps.tracks;
    this.#storage = deps.storage;
  }

  async execute(trackId: string, ownerId: string): Promise<Result<SeparableTrack, LibraryError>> {
    const found = await findOwnedTrack(this.#tracks, trackId, ownerId);
    if (found.isErr()) return err(found.error);
    const track = found.value;
    const allowed = track.canStartSeparation();
    if (allowed.isErr()) return err(allowed.error);
    const t = track.toSnapshot();
    if (!(await this.#storage.exists(t.inputKey))) {
      return err(libraryError("UPLOAD_MISSING", "The file has not been uploaded yet."));
    }
    return ok({ trackId: t.id, inputKey: t.inputKey, outputPrefix: track.stemsPrefix });
  }
}

/** Public query for the separation module: jobs belong to whoever owns their track. */
export class CheckTrackOwnership {
  #tracks: TrackRepository;

  constructor(deps: { tracks: TrackRepository }) {
    this.#tracks = deps.tracks;
  }

  async execute(trackId: string, userId: string): Promise<boolean> {
    return (await findOwnedTrack(this.#tracks, trackId, userId)).isOk();
  }
}
