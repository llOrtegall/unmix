import type { TransactionManager } from "../../../../shared/kernel/ports.ts";
import { err, ok, type Result } from "../../../../shared/kernel/result.ts";
import { type LibraryError, libraryError } from "../../domain/errors.ts";
import type { ObjectStorage, TrackRepository } from "../ports/index.ts";

export class DeleteTrack {
  #tracks: TrackRepository;
  #storage: ObjectStorage;
  #tx: TransactionManager;

  constructor(deps: { tracks: TrackRepository; storage: ObjectStorage; tx: TransactionManager }) {
    this.#tracks = deps.tracks;
    this.#storage = deps.storage;
    this.#tx = deps.tx;
  }

  async execute(trackId: string): Promise<Result<void, LibraryError>> {
    const result = await this.#tx.run(async (): Promise<Result<void, LibraryError>> => {
      const track = await this.#tracks.findById(trackId);
      if (!track) return err(libraryError("TRACK_NOT_FOUND", "Track not found."));
      const allowed = track.canDelete();
      if (allowed.isErr()) return allowed;
      await this.#tracks.delete(trackId);
      return ok(undefined);
    });
    // Files go after the commit: a failed delete leaves orphans, never a row without files.
    if (result.isOk()) await this.#storage.deletePrefix(`tracks/${trackId}/`);
    return result;
  }
}
