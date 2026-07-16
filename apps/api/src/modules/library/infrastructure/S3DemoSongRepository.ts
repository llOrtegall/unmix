import { ObjectKey } from "../../shared/domain/ObjectKey.ts";
import { DemoSong, type DemoSongPrimitive } from "../domain/DemoSong.ts";
import type { DemoSongRepository } from "../domain/DemoSongRepository.ts";
import type { StorageRepository } from "../domain/StorageRepository.ts";

export const DEMO_MANIFEST_KEY = ObjectKey.create("demo/manifest.json");

// Not cached: it is read once per sign-up, and a re-seed must reach new users without restarting the API.
export class S3DemoSongRepository implements DemoSongRepository {
  private readonly storage: StorageRepository;

  constructor(storage: StorageRepository) {
    this.storage = storage;
  }

  async find(): Promise<DemoSong | null> {
    if (!(await this.storage.exists(DEMO_MANIFEST_KEY))) return null;
    const chunks: Buffer[] = [];
    for await (const chunk of await this.storage.read(DEMO_MANIFEST_KEY)) chunks.push(chunk as Buffer);
    return DemoSong.fromPrimitive(JSON.parse(Buffer.concat(chunks).toString("utf8")) as DemoSongPrimitive);
  }
}
