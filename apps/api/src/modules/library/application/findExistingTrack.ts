import { TrackNotFoundError } from "../domain/errors/TrackNotFoundError.ts";
import type { Track } from "../domain/Track.ts";
import { TrackId } from "../domain/TrackId.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";

export const findExistingTrack =
  ({ trackRepository }: { trackRepository: TrackRepository }) =>
  async (trackId: string): Promise<Track> => {
    const track = await trackRepository.findById(TrackId.fromPrimitive(trackId));
    if (!track) throw new TrackNotFoundError(trackId);
    return track;
  };
