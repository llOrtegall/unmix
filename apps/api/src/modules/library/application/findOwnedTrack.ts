import { UserId } from "../../shared/domain/UserId.ts";
import { TrackNotFoundError } from "../domain/errors/TrackNotFoundError.ts";
import type { Track } from "../domain/Track.ts";
import { TrackId } from "../domain/TrackId.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";

// Someone else's track reads as missing, so ids never leak across users.
export const findOwnedTrack =
  ({ trackRepository }: { trackRepository: TrackRepository }) =>
  async (trackId: string, ownerId: string): Promise<Track> => {
    const track = await trackRepository.findById(TrackId.fromPrimitive(trackId));
    if (!track?.isOwnedBy(UserId.fromPrimitive(ownerId))) throw new TrackNotFoundError(trackId);
    return track;
  };
