import type { UserId } from "../../shared/domain/UserId.ts";
import type { Track } from "../../library/domain/Track.ts";
import type { TrackId } from "../../library/domain/TrackId.ts";

export interface TrackCatalogRepository {
  findSeparableTrack(trackId: TrackId, userId: UserId): Promise<Track>;
  isOwnedBy(trackId: TrackId, userId: UserId): Promise<boolean>;
}
