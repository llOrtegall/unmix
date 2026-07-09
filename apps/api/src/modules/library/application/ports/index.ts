import type { Readable } from "node:stream";
import type { DemoSong, Track } from "../../domain/track.ts";

export interface TrackPage {
  items: Track[];
  nextCursor: Date | null;
}

export interface TrackRepository {
  findById(id: string): Promise<Track | null>;
  save(track: Track): Promise<void>;
  delete(id: string): Promise<void>;
  /** The owner's tracks, newest first; `cursor` is the `createdAt` of the last item already seen. */
  list(ownerId: string, cursor: Date | null, limit: number): Promise<TrackPage>;
  /** Ids of tracks still waiting for their file since before `before`. */
  findAbandonedUploads(before: Date): Promise<string[]>;
  /** The subset of `ids` that still have a row. */
  existingIds(ids: string[]): Promise<Set<string>>;
}

/** Where the shared, pre-separated demo song is described (null until it is seeded). */
export interface DemoLibrary {
  load(): Promise<DemoSong | null>;
}

export interface ObjectStorage {
  presignUpload(key: string, contentType: string, expiresInSeconds: number): Promise<string>;
  presignDownload(key: string, expiresInSeconds: number, filename?: string): Promise<string>;
  exists(key: string): Promise<boolean>;
  read(key: string): Promise<Readable>;
  deletePrefix(prefix: string): Promise<void>;
  /** Immediate "folders" under `prefix`, e.g. `tracks/<id>/`. */
  listPrefixes(prefix: string): Promise<string[]>;
}
