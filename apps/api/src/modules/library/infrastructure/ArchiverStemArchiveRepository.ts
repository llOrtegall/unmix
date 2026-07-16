import type { Readable } from "node:stream";
import { ZipArchive } from "archiver";
import type { StemArchive } from "../domain/StemArchive.ts";
import type { StemArchiveRepository } from "../domain/StemArchiveRepository.ts";
import type { StorageRepository } from "../domain/StorageRepository.ts";

export class ArchiverStemArchiveRepository implements StemArchiveRepository {
  private readonly storage: StorageRepository;

  constructor(storage: StorageRepository) {
    this.storage = storage;
  }

  async pack(archive: StemArchive): Promise<Readable> {
    // FLAC is already compressed: store entries without deflate.
    const zip = new ZipArchive({ store: true });
    void this.append(zip, archive).catch((error: unknown) => zip.destroy(error as Error));
    return zip;
  }

  private async append(zip: ZipArchive, archive: StemArchive): Promise<void> {
    const entries = archive.getEntries().map((entry) => ({ name: entry.getPath(), key: entry.getKey() }));
    for (const { name, key } of entries) zip.append(await this.storage.read(key), { name });
    await zip.finalize();
  }
}
