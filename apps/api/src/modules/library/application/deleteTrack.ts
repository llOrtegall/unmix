import type { TransactionRepository } from "../../shared/domain/TransactionRepository.ts";
import type { StorageRepository } from "../domain/StorageRepository.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";
import { removeTrack } from "./removeTrack.ts";

interface Dependencies {
  readonly trackRepository: TrackRepository;
  readonly storageRepository: StorageRepository;
  readonly transactionRepository: TransactionRepository;
}

export const deleteTrack = ({ trackRepository, storageRepository, transactionRepository }: Dependencies) => {
  const remove = removeTrack({ trackRepository });

  return async (trackId: string, ownerId: string): Promise<void> => {
    const removed = await transactionRepository.run(() => remove(trackId, ownerId));
    // Files go after the commit: a failed delete leaves orphans, never a row without files.
    await storageRepository.deleteFolder(removed.getFolder());
  };
};
