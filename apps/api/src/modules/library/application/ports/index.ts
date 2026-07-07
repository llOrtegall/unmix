import type { Readable } from "node:stream";
import type { Track } from "../../domain/track.ts";

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
}

export interface ObjectStorage {
  presignUpload(key: string, contentType: string, expiresInSeconds: number): Promise<string>;
  presignDownload(key: string, expiresInSeconds: number, filename?: string): Promise<string>;
  exists(key: string): Promise<boolean>;
  read(key: string): Promise<Readable>;
  deletePrefix(prefix: string): Promise<void>;
}
