import type { Readable } from "node:stream";
import type { ObjectStorage, TrackRepository } from "../../src/modules/library/application/ports/index.ts";
import type { Track } from "../../src/modules/library/domain/track.ts";
import type { DomainEvent } from "../../src/shared/kernel/domain-event.ts";
import type { Clock, EventPublisher, IdGenerator, TransactionManager } from "../../src/shared/kernel/ports.ts";
import { err, ok } from "../../src/shared/kernel/result.ts";
import type { JobRepository, JobUpdates, JobView, TrackCatalog } from "../../src/modules/separation/application/ports/index.ts";
import { SeparationJob } from "../../src/modules/separation/domain/separation-job.ts";

export const clock: Clock = { now: () => new Date("2026-07-01T12:00:00Z") };

export function sequentialIds(prefix = "id"): IdGenerator {
  let n = 0;
  return { next: () => `${prefix}-${++n}` };
}

export const passthroughTx: TransactionManager = { run: (work) => work() };

export class RecordingPublisher implements EventPublisher {
  events: DomainEvent[] = [];
  async publish(events: DomainEvent[]) {
    this.events.push(...events);
  }
}

export class InMemoryJobs implements JobRepository {
  rows = new Map<string, JobView>();
  async findById(id: string) {
    const row = this.rows.get(id);
    return row ? SeparationJob.restore({ ...row }) : null;
  }
  async save(job: SeparationJob) {
    this.rows.set(job.id, job.toSnapshot());
  }
  async findUnfinished() {
    return [...this.rows.values()]
      .filter((r) => r.status === "queued" || r.status === "processing")
      .map((r) => SeparationJob.restore({ ...r }));
  }
}

export class RecordingUpdates implements JobUpdates {
  published: JobView[] = [];
  publish(job: JobView) {
    this.published.push(job);
  }
  subscribe() {
    return () => {};
  }
}

/** Every track belongs to `owner`. */
export function catalog(ready: boolean, owner = "u1"): TrackCatalog {
  return {
    getSeparableTrack: async (trackId, userId) => {
      if (userId !== owner) return err({ code: "TRACK_NOT_FOUND", message: "not found" });
      return ready
        ? ok({ trackId, inputKey: `tracks/${trackId}/original.mp3`, outputPrefix: `tracks/${trackId}/stems` })
        : err({ code: "UPLOAD_MISSING", message: "not uploaded" });
    },
    isOwnedBy: async (_trackId, userId) => userId === owner,
  };
}

export class InMemoryTracks implements TrackRepository {
  rows = new Map<string, Track>();
  async findById(id: string) {
    return this.rows.get(id) ?? null;
  }
  async save(track: Track) {
    this.rows.set(track.id, track);
  }
  async delete(id: string) {
    this.rows.delete(id);
  }
  async list(ownerId: string, _cursor: Date | null, limit: number) {
    const items = [...this.rows.values()].filter((t) => t.isOwnedBy(ownerId)).slice(0, limit);
    return { items, nextCursor: null };
  }
  async findAbandonedUploads(before: Date) {
    return [...this.rows.values()]
      .map((t) => t.toSnapshot())
      .filter((t) => t.status === "awaiting_upload" && t.createdAt < before)
      .map((t) => t.id);
  }
  async existingIds(ids: string[]) {
    return new Set(ids.filter((id) => this.rows.has(id)));
  }
}

/** Object keys only; content is irrelevant to the use cases under test. */
export class InMemoryStorage implements ObjectStorage {
  keys = new Set<string>();
  async presignUpload(key: string) {
    return `put:${key}`;
  }
  async presignDownload(key: string) {
    return `get:${key}`;
  }
  async exists(key: string) {
    return this.keys.has(key);
  }
  async read(): Promise<Readable> {
    throw new Error("not needed");
  }
  async deletePrefix(prefix: string) {
    for (const key of this.keys) if (key.startsWith(prefix)) this.keys.delete(key);
  }
  async listPrefixes(prefix: string) {
    const folders = [...this.keys].filter((k) => k.startsWith(prefix)).map((k) => k.slice(0, k.indexOf("/", prefix.length) + 1));
    return [...new Set(folders)].filter((f) => f.length > prefix.length);
  }
}
