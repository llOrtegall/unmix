import type { CheckTrackOwnership, GetSeparableTrack } from "../../library/index.ts";
import type { TrackCatalog } from "../application/ports/index.ts";

/** Anti-corruption adapter over the library module's public API. */
export class LibraryTrackCatalog implements TrackCatalog {
  #separable: GetSeparableTrack;
  #ownership: CheckTrackOwnership;

  constructor(deps: { separable: GetSeparableTrack; ownership: CheckTrackOwnership }) {
    this.#separable = deps.separable;
    this.#ownership = deps.ownership;
  }

  getSeparableTrack(trackId: string, userId: string) {
    return this.#separable.execute(trackId, userId);
  }

  isOwnedBy(trackId: string, userId: string) {
    return this.#ownership.execute(trackId, userId);
  }
}
