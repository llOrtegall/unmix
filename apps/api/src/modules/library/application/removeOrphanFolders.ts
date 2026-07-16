import type { StorageRepository } from "../domain/StorageRepository.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";

interface Dependencies {
  readonly trackRepository: TrackRepository;
  readonly storageRepository: StorageRepository;
}

export const removeOrphanFolders =
  ({ trackRepository, storageRepository }: Dependencies) =>
  async (): Promise<number> => {
    const folders = await storageRepository.findTrackFolders();
    const orphans = folders.excluding(await trackRepository.findExistingIds(folders.getTrackIds()));
    await Promise.all(orphans.map((folder) => storageRepository.deleteFolder(folder)));
    return orphans.count();
  };
