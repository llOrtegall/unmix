import type { Readable } from "node:stream";
import { err, ok, type Result } from "../../../../shared/kernel/result.ts";
import { type LibraryError, libraryError } from "../../domain/errors.ts";
import type { ObjectStorage, TrackRepository } from "../ports/index.ts";

export interface StemArchive {
  filename: string;
  entries: { name: string; open: () => Promise<Readable> }[];
}

/** Lists the stems to pack into a ZIP; the HTTP layer streams the archive. */
export class DownloadStems {
  #tracks: TrackRepository;
  #storage: ObjectStorage;

  constructor(deps: { tracks: TrackRepository; storage: ObjectStorage }) {
    this.#tracks = deps.tracks;
    this.#storage = deps.storage;
  }

  async execute(trackId: string): Promise<Result<StemArchive, LibraryError>> {
    const track = await this.#tracks.findById(trackId);
    if (!track) return err(libraryError("TRACK_NOT_FOUND", "Track not found."));
    const t = track.toSnapshot();
    if (t.status !== "completed") {
      return err(libraryError("INVALID_STATE", "Stems are not ready yet."));
    }
    return ok({
      filename: `${t.title} - stems.zip`,
      entries: t.stems.map((s) => ({
        name: `${s.name}.flac`,
        open: () => this.#storage.read(s.key),
      })),
    });
  }
}
