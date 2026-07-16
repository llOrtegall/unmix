import { PlayableStemList } from "../domain/PlayableStemList.ts";
import { PlayableTrack } from "../domain/PlayableTrack.ts";
import type { StorageRepository } from "../domain/StorageRepository.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";
import { findOwnedTrack } from "./findOwnedTrack.ts";
import { signStem } from "./signStem.ts";

interface Dependencies {
  readonly trackRepository: TrackRepository;
  readonly storageRepository: StorageRepository;
}

export const findTrack = ({ trackRepository, storageRepository }: Dependencies) => {
  const findOwned = findOwnedTrack({ trackRepository });
  const sign = signStem({ storageRepository });

  return async (trackId: string, ownerId: string): Promise<PlayableTrack> => {
    const track = await findOwned(trackId, ownerId);
    const stems = await Promise.all(track.getStems().map((stem) => sign(stem, track.getTitle())));
    return PlayableTrack.create(track, PlayableStemList.create(stems));
  };
};
