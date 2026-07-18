import type { UserId } from "../../shared/domain/UserId.ts";
import type { LibraryModule } from "../../library/application/factory.ts";
import type { Track } from "../../library/domain/Track.ts";
import type { TrackId } from "../../library/domain/TrackId.ts";
import type { TrackCatalogRepository } from "../domain/TrackCatalogRepository.ts";

// Library rejections are domain errors and reach the HTTP error handler unchanged.
export class LibraryTrackCatalogRepository implements TrackCatalogRepository {
  private readonly library: LibraryModule;

  constructor(library: LibraryModule) {
    this.library = library;
  }

  findSeparableTrack(trackId: TrackId, userId: UserId): Promise<Track> {
    return this.library.findSeparableTrack(trackId.toPrimitive(), userId.toPrimitive());
  }

  isOwnedBy(trackId: TrackId, userId: UserId): Promise<boolean> {
    return this.library.checkTrackOwnership(trackId.toPrimitive(), userId.toPrimitive());
  }
}
