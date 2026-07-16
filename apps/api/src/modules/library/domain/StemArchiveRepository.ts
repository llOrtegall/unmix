import type { Readable } from "node:stream";
import type { StemArchive } from "./StemArchive.ts";

export interface StemArchiveRepository {
  pack(archive: StemArchive): Promise<Readable>;
}
