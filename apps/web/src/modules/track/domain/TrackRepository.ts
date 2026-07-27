import type { PageCursor } from "./PageCursor.ts";
import type { Track } from "./Track.ts";
import type { TrackId } from "./TrackId.ts";
import type { TrackPage } from "./TrackPage.ts";
import type { UploadCandidate } from "./UploadCandidate.ts";
import type { UploadTicket } from "./UploadTicket.ts";

export interface TrackRepository {
  list(cursor: PageCursor | null): Promise<TrackPage>;
  findById(id: TrackId): Promise<Track | null>;
  delete(id: TrackId): Promise<void>;
  createUpload(candidate: UploadCandidate): Promise<UploadTicket>;
  requestSeparation(id: TrackId): Promise<void>;
}
