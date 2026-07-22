import { StemArchive } from "../domain/StemArchive.ts";
import type { StemArchiveRepository } from "../domain/StemArchiveRepository.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";
import { findOwnedTrack } from "./findOwnedTrack.ts";

export interface StemDownload {
  readonly archive: StemArchive;
  readonly content: ReadableStream<Uint8Array>;
}

interface Dependencies {
  readonly trackRepository: TrackRepository;
  readonly stemArchiveRepository: StemArchiveRepository;
}

export const downloadStems = ({ trackRepository, stemArchiveRepository }: Dependencies) => {
  const findOwned = findOwnedTrack({ trackRepository });

  return async (trackId: string, ownerId: string): Promise<StemDownload> => {
    const archive = StemArchive.forTrack(await findOwned(trackId, ownerId));
    return { archive, content: await stemArchiveRepository.pack(archive) };
  };
};
