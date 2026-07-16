import type { StorageRepository } from "../domain/StorageRepository.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";
import { removeAbandonedUploads } from "./removeAbandonedUploads.ts";
import { removeOrphanFolders } from "./removeOrphanFolders.ts";

export interface GarbageReport {
  readonly abandonedUploads: number;
  readonly orphanFolders: number;
}

interface Dependencies {
  readonly trackRepository: TrackRepository;
  readonly storageRepository: StorageRepository;
}

export const collectGarbage = ({ trackRepository, storageRepository }: Dependencies) => {
  const removeUploads = removeAbandonedUploads({ trackRepository });
  const removeFolders = removeOrphanFolders({ trackRepository, storageRepository });

  return async (): Promise<GarbageReport> => {
    // Rows go first, so their folders are swept as orphans in the same run.
    const abandonedUploads = await removeUploads();
    const orphanFolders = await removeFolders();
    return { abandonedUploads, orphanFolders };
  };
};
