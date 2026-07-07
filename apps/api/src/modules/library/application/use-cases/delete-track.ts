import type { TransactionManager } from "../../../../shared/kernel/ports.ts";
import { err, ok, type Result } from "../../../../shared/kernel/result.ts";
import type { LibraryError } from "../../domain/errors.ts";
import type { ObjectStorage, TrackRepository } from "../ports/index.ts";
import { findOwnedTrack } from "./find-owned-track.ts";

export class DeleteTrack {
  #tracks: TrackRepository;
  #storage: ObjectStorage;
  #tx: TransactionManager;

  constructor(deps: { tracks: TrackRepository; storage: ObjectStorage; tx: TransactionManager }) {
    this.#tracks = deps.tracks;
    this.#storage = deps.storage;
    this.#tx = deps.tx;
  }

  async execute(trackId: string, ownerId: string): Promise<Result<void, LibraryError>> {
    const result = await this.#tx.run(async (): Promise<Result<void, LibraryError>> => {
      const track = await findOwnedTrack(this.#tracks, trackId, ownerId);
      if (track.isErr()) return err(track.error);
      const allowed = track.value.canDelete();
      if (allowed.isErr()) return allowed;
      await this.#tracks.delete(trackId);
      return ok(undefined);
    });
    // Files go after the commit: a failed delete leaves orphans, never a row without files.
    if (result.isOk()) await this.#storage.deletePrefix(`tracks/${trackId}/`);
    return result;
  }
}
