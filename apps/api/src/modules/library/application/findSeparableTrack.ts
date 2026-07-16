import { UploadMissingError } from "../domain/errors/UploadMissingError.ts";
import type { StorageRepository } from "../domain/StorageRepository.ts";
import type { Track } from "../domain/Track.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";
import { findOwnedTrack } from "./findOwnedTrack.ts";

interface Dependencies {
  readonly trackRepository: TrackRepository;
  readonly storageRepository: StorageRepository;
}

export const findSeparableTrack = ({ trackRepository, storageRepository }: Dependencies) => {
  const findOwned = findOwnedTrack({ trackRepository });

  return async (trackId: string, ownerId: string): Promise<Track> => {
    const track = await findOwned(trackId, ownerId);
    track.ensureCanStartSeparation();
    if (!(await storageRepository.exists(track.getInputKey()))) throw new UploadMissingError(trackId);
    return track;
  };
};
