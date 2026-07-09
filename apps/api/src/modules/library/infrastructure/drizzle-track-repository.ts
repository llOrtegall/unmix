import { and, desc, eq, inArray, lt } from "drizzle-orm";
import type { DrizzleTransactions } from "../../../shared/infrastructure/db.ts";
import type { TrackPage, TrackRepository } from "../application/ports/index.ts";
import { MediaType } from "../domain/media-type.ts";
import type { Stem, StemName } from "../domain/stem.ts";
import { Track, type TrackStatus } from "../domain/track.ts";
import { stems, tracks } from "./schema.ts";

type TrackRow = typeof tracks.$inferSelect;
type StemRow = typeof stems.$inferSelect;

export class DrizzleTrackRepository implements TrackRepository {
  #tx: DrizzleTransactions;

  constructor(tx: DrizzleTransactions) {
    this.#tx = tx;
  }

  async findById(id: string): Promise<Track | null> {
    const db = this.#tx.executor();
    const [row] = await db.select().from(tracks).where(eq(tracks.id, id));
    if (!row) return null;
    const stemRows = await db.select().from(stems).where(eq(stems.trackId, id));
    return toDomain(row, stemRows);
  }

  async save(track: Track): Promise<void> {
    const t = track.toSnapshot();
    const values = {
      id: t.id,
      userId: t.ownerId,
      title: t.title,
      originalFilename: t.originalFilename,
      contentType: t.mediaType.value,
      sizeBytes: t.sizeBytes,
      inputKey: t.inputKey,
      status: t.status,
      durationSeconds: t.durationSeconds,
      latestJobId: t.latestJobId,
      credit: t.credit,
      createdAt: t.createdAt,
    };
    await this.#tx.run(async () => {
      const db = this.#tx.executor();
      await db.insert(tracks).values(values).onConflictDoUpdate({ target: tracks.id, set: values });
      await db.delete(stems).where(eq(stems.trackId, t.id));
      if (t.stems.length > 0) {
        await db.insert(stems).values(
          t.stems.map((s) => ({
            trackId: t.id,
            name: s.name,
            objectKey: s.key,
            sizeBytes: s.sizeBytes,
            silent: s.silent,
            previewKey: s.previewKey,
            peaksKey: s.peaksKey,
          })),
        );
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.#tx.executor().delete(tracks).where(eq(tracks.id, id));
  }

  async list(ownerId: string, cursor: Date | null, limit: number): Promise<TrackPage> {
    const db = this.#tx.executor();
    const rows = await db
      .select()
      .from(tracks)
      .where(and(eq(tracks.userId, ownerId), cursor ? lt(tracks.createdAt, cursor) : undefined))
      .orderBy(desc(tracks.createdAt))
      .limit(limit + 1);
    const page = rows.slice(0, limit);
    const stemRows = page.length
      ? await db.select().from(stems).where(inArray(stems.trackId, page.map((r) => r.id)))
      : [];
    return {
      items: page.map((r) => toDomain(r, stemRows.filter((s) => s.trackId === r.id))),
      nextCursor: rows.length > limit ? (page.at(-1)?.createdAt ?? null) : null,
    };
  }

  async findAbandonedUploads(before: Date): Promise<string[]> {
    const rows = await this.#tx
      .executor()
      .select({ id: tracks.id })
      .from(tracks)
      .where(and(eq(tracks.status, "awaiting_upload"), lt(tracks.createdAt, before)));
    return rows.map((r) => r.id);
  }

  async existingIds(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await this.#tx.executor().select({ id: tracks.id }).from(tracks).where(inArray(tracks.id, ids));
    return new Set(rows.map((r) => r.id));
  }
}

function toDomain(row: TrackRow, stemRows: StemRow[]): Track {
  return Track.restore({
    id: row.id,
    ownerId: row.userId,
    title: row.title,
    originalFilename: row.originalFilename,
    mediaType: MediaType.restore(row.contentType),
    sizeBytes: row.sizeBytes,
    inputKey: row.inputKey,
    status: row.status as TrackStatus,
    durationSeconds: row.durationSeconds,
    latestJobId: row.latestJobId,
    stems: stemRows.map(
      (s): Stem => ({
        name: s.name as StemName,
        key: s.objectKey,
        sizeBytes: s.sizeBytes,
        silent: s.silent,
        previewKey: s.previewKey,
        peaksKey: s.peaksKey,
      }),
    ),
    credit: row.credit,
    createdAt: row.createdAt,
  });
}
