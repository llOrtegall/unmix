import { ok } from "../../../shared/kernel/result.ts";
import type { LibraryModule } from "../../library/application/factory.ts";
import type { TrackCatalog } from "../application/ports/index.ts";

// Library rejections are thrown as domain errors and reach the HTTP error handler unchanged.
export class LibraryTrackCatalog implements TrackCatalog {
  private readonly library: LibraryModule;

  constructor(library: LibraryModule) {
    this.library = library;
  }

  async getSeparableTrack(trackId: string, userId: string) {
    const track = await this.library.findSeparableTrack(trackId, userId);
    return ok({
      trackId: track.getId().toPrimitive(),
      inputKey: track.getInputKey().toPrimitive(),
      outputPrefix: track.getStemsPrefix().toPrimitive(),
    });
  }

  isOwnedBy(trackId: string, userId: string) {
    return this.library.checkTrackOwnership(trackId, userId);
  }
}
