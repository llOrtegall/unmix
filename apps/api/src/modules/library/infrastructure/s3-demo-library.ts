import type { DemoLibrary, ObjectStorage } from "../application/ports/index.ts";
import type { DemoSong } from "../domain/track.ts";

export const DEMO_MANIFEST_KEY = "demo/manifest.json";

/**
 * Reads the manifest written by `pnpm demo:seed`. Not cached: it is read once per
 * sign-up, and a re-seed must reach new users without restarting the API.
 */
export class S3DemoLibrary implements DemoLibrary {
  #storage: ObjectStorage;

  constructor(storage: ObjectStorage) {
    this.#storage = storage;
  }

  async load(): Promise<DemoSong | null> {
    if (!(await this.#storage.exists(DEMO_MANIFEST_KEY))) return null;
    const chunks: Buffer[] = [];
    for await (const chunk of await this.#storage.read(DEMO_MANIFEST_KEY)) chunks.push(chunk as Buffer);
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as DemoSong;
  }
}
