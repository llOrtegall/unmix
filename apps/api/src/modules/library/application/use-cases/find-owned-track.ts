import { err, ok, type Result } from "../../../../shared/kernel/result.ts";
import { type LibraryError, libraryError } from "../../domain/errors.ts";
import type { Track } from "../../domain/track.ts";
import type { TrackRepository } from "../ports/index.ts";

/** Someone else's track reads as missing, so ids never leak across users. */
export async function findOwnedTrack(
  tracks: TrackRepository,
  trackId: string,
  ownerId: string,
): Promise<Result<Track, LibraryError>> {
  const track = await tracks.findById(trackId);
  if (!track?.isOwnedBy(ownerId)) return err(libraryError("TRACK_NOT_FOUND", "Track not found."));
  return ok(track);
}
