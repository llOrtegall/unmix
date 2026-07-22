import type { StemArchive } from "./StemArchive.ts";

export interface StemArchiveRepository {
  pack(archive: StemArchive): Promise<ReadableStream<Uint8Array>>;
}
