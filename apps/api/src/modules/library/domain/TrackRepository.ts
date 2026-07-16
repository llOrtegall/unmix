import type { UserId } from "../../shared/domain/UserId.ts";
import type { CreatedAt } from "./CreatedAt.ts";
import type { PageSize } from "./PageSize.ts";
import type { Track } from "./Track.ts";
import type { TrackId } from "./TrackId.ts";
import type { TrackIdList } from "./TrackIdList.ts";
import type { TrackList } from "./TrackList.ts";
import type { TrackPage } from "./TrackPage.ts";

export interface TrackRepository {
  save(track: Track): Promise<void>;
  findById(id: TrackId): Promise<Track | null>;
  delete(id: TrackId): Promise<void>;
  findPageByOwner(ownerId: UserId, before: CreatedAt | null, size: PageSize): Promise<TrackPage>;
  findAwaitingUploadCreatedBefore(cutoff: CreatedAt): Promise<TrackList>;
  findExistingIds(ids: TrackIdList): Promise<TrackIdList>;
}
