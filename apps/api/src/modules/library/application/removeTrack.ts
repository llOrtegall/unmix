import type { Track } from "../domain/Track.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";
import { findOwnedTrack } from "./findOwnedTrack.ts";

export const removeTrack = ({ trackRepository }: { trackRepository: TrackRepository }) => {
  const findOwned = findOwnedTrack({ trackRepository });

  return async (trackId: string, ownerId: string): Promise<Track> => {
    const track = await findOwned(trackId, ownerId);
    track.ensureCanBeDeleted();
    await trackRepository.delete(track.getId());
    return track;
  };
};
