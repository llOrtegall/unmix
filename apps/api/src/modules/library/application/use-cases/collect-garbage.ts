import type { Clock } from "../../../../shared/kernel/ports.ts";
import type { ObjectStorage, TrackRepository } from "../ports/index.ts";

// Only folders named like track ids; anything else under tracks/ is left alone.
const TRACK_PREFIX = /^tracks\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/$/;

/**
 * Removes what nobody will come back for: uploads never finished within
 * `abandonAfterMs`, and files in storage whose track row is gone.
 * Finished songs stay until their owner deletes them.
 */
export class CollectGarbage {
  #tracks: TrackRepository;
  #storage: ObjectStorage;
  #clock: Clock;
  #abandonAfterMs: number;

  constructor(deps: { tracks: TrackRepository; storage: ObjectStorage; clock: Clock; abandonAfterMs: number }) {
    this.#tracks = deps.tracks;
    this.#storage = deps.storage;
    this.#clock = deps.clock;
    this.#abandonAfterMs = deps.abandonAfterMs;
  }

  async execute(): Promise<{ abandonedUploads: number; orphanFolders: number }> {
    const before = new Date(this.#clock.now().getTime() - this.#abandonAfterMs);
    const abandoned = await this.#tracks.findAbandonedUploads(before);
    for (const id of abandoned) await this.#tracks.delete(id);

    // Rows go first, so their folders are swept below as orphans.
    const folders = (await this.#storage.listPrefixes("tracks/")).flatMap((prefix) => {
      const id = TRACK_PREFIX.exec(prefix)?.[1];
      return id ? [{ id, prefix }] : [];
    });
    const alive = await this.#tracks.existingIds(folders.map((f) => f.id));
    const orphans = folders.filter((f) => !alive.has(f.id));
    for (const { prefix } of orphans) await this.#storage.deletePrefix(prefix);

    return { abandonedUploads: abandoned.length, orphanFolders: orphans.length };
  }
}
