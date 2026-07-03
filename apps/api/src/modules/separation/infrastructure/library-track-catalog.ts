import type { GetSeparableTrack } from "../../library/index.ts";
import type { TrackCatalog } from "../application/ports/index.ts";

/** Anti-corruption adapter over the library module's public API. */
export class LibraryTrackCatalog implements TrackCatalog {
  #query: GetSeparableTrack;

  constructor(query: GetSeparableTrack) {
    this.#query = query;
  }

  getSeparableTrack(trackId: string) {
    return this.#query.execute(trackId);
  }
}
