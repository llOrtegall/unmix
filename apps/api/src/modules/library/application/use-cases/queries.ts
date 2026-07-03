import { err, ok, type Result } from "../../../../shared/kernel/result.ts";
import { type LibraryError, libraryError } from "../../domain/errors.ts";
import type { StemName } from "../../domain/stem.ts";
import type { TrackStatus } from "../../domain/track.ts";
import type { ObjectStorage, TrackRepository } from "../ports/index.ts";

export interface TrackSummaryView {
  trackId: string;
  title: string;
  status: TrackStatus;
  durationSeconds: number | null;
  createdAt: string;
}

export interface TrackDetailView extends TrackSummaryView {
  latestJobId: string | null;
  stems: { name: StemName; url: string; sizeBytes: number; silent: boolean }[];
}

export class GetTrack {
  #tracks: TrackRepository;
  #storage: ObjectStorage;
  #ttl: number;

  constructor(deps: { tracks: TrackRepository; storage: ObjectStorage; downloadUrlTtlSeconds: number }) {
    this.#tracks = deps.tracks;
    this.#storage = deps.storage;
    this.#ttl = deps.downloadUrlTtlSeconds;
  }

  async execute(trackId: string): Promise<Result<TrackDetailView, LibraryError>> {
    const track = await this.#tracks.findById(trackId);
    if (!track) return err(libraryError("TRACK_NOT_FOUND", "Track not found."));
    const t = track.toSnapshot();
    const stems = await Promise.all(
      t.stems.map(async (s) => ({
        name: s.name,
        url: await this.#storage.presignDownload(s.key, this.#ttl, `${t.title} - ${s.name}.flac`),
        sizeBytes: s.sizeBytes,
        silent: s.silent,
      })),
    );
    return ok({ ...summary(t), latestJobId: t.latestJobId, stems });
  }
}

export class ListTracks {
  #tracks: TrackRepository;

  constructor(deps: { tracks: TrackRepository }) {
    this.#tracks = deps.tracks;
  }

  async execute(cursor: string | undefined, limit: number) {
    const page = await this.#tracks.list(cursor ? new Date(cursor) : null, limit);
    return {
      items: page.items.map((t) => summary(t.toSnapshot())),
      nextCursor: page.nextCursor?.toISOString() ?? null,
    };
  }
}

function summary(t: {
  id: string;
  title: string;
  status: TrackStatus;
  durationSeconds: number | null;
  createdAt: Date;
}): TrackSummaryView {
  return {
    trackId: t.id,
    title: t.title,
    status: t.status,
    durationSeconds: t.durationSeconds,
    createdAt: t.createdAt.toISOString(),
  };
}
