import { and, desc, eq, inArray, lt } from "drizzle-orm";
import type { UserId } from "../../shared/domain/UserId.ts";
import type { DrizzleTransactionRepository } from "../../shared/infrastructure/DrizzleTransactionRepository.ts";
import { CreatedAt } from "../domain/CreatedAt.ts";
import type { MediaTypePrimitive } from "../domain/MediaType.ts";
import type { PageSize } from "../domain/PageSize.ts";
import type { StemPrimitive } from "../domain/Stem.ts";
import type { StemNamePrimitive } from "../domain/StemName.ts";
import { Track } from "../domain/Track.ts";
import type { TrackId } from "../domain/TrackId.ts";
import { TrackIdList } from "../domain/TrackIdList.ts";
import { TrackList } from "../domain/TrackList.ts";
import { TrackPage } from "../domain/TrackPage.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";
import type { TrackStatusPrimitive } from "../domain/TrackStatus.ts";
import { stems, tracks } from "./trackSchema.ts";

type TrackRow = typeof tracks.$inferSelect;
type StemRow = typeof stems.$inferSelect;

export class DrizzleTrackRepository implements TrackRepository {
  private readonly transactions: DrizzleTransactionRepository;

  constructor(transactions: DrizzleTransactionRepository) {
    this.transactions = transactions;
  }

  async save(track: Track): Promise<void> {
    const primitive = track.toPrimitive();
    const row = this.toRow(track);
    await this.transactions.run(async () => {
      const db = this.transactions.executor();
      await db.insert(tracks).values(row).onConflictDoUpdate({ target: tracks.id, set: row });
      await db.delete(stems).where(eq(stems.trackId, primitive.id));
      if (primitive.stems.length > 0) {
        await db.insert(stems).values(primitive.stems.map((stem) => this.toStemRow(primitive.id, stem)));
      }
    });
  }

  async findById(id: TrackId): Promise<Track | null> {
    const db = this.transactions.executor();
    const [row] = await db.select().from(tracks).where(eq(tracks.id, id.toPrimitive()));
    if (!row) return null;
    const stemRows = await db.select().from(stems).where(eq(stems.trackId, row.id));
    return this.toDomain(row, stemRows);
  }

  async delete(id: TrackId): Promise<void> {
    await this.transactions.executor().delete(tracks).where(eq(tracks.id, id.toPrimitive()));
  }

  async findPageByOwner(ownerId: UserId, before: CreatedAt | null, size: PageSize): Promise<TrackPage> {
    const db = this.transactions.executor();
    const limit = size.toPrimitive();
    const rows = await db
      .select()
      .from(tracks)
      .where(
        and(
          eq(tracks.userId, ownerId.toPrimitive()),
          before ? lt(tracks.createdAt, new Date(before.toPrimitive())) : undefined,
        ),
      )
      .orderBy(desc(tracks.createdAt))
      .limit(limit + 1);
    const page = rows.slice(0, limit);
    const stemRows = await this.findStemRows(page.map((row) => row.id));
    const list = TrackList.create(page.map((row) => this.toDomain(row, stemRows.filter((stem) => stem.trackId === row.id))));
    const last = page.at(-1);
    return rows.length > limit && last ? TrackPage.create(list, CreatedAt.create(last.createdAt)) : TrackPage.lastPage(list);
  }

  async findAwaitingUploadCreatedBefore(cutoff: CreatedAt): Promise<TrackList> {
    const rows = await this.transactions
      .executor()
      .select()
      .from(tracks)
      .where(and(eq(tracks.status, "awaiting_upload"), lt(tracks.createdAt, new Date(cutoff.toPrimitive()))));
    return TrackList.create(rows.map((row) => this.toDomain(row, [])));
  }

  async findExistingIds(ids: TrackIdList): Promise<TrackIdList> {
    if (ids.isEmpty()) return TrackIdList.empty();
    const rows = await this.transactions
      .executor()
      .select({ id: tracks.id })
      .from(tracks)
      .where(inArray(tracks.id, [...ids.toPrimitive()]));
    return TrackIdList.fromPrimitive(rows.map((row) => row.id));
  }

  private async findStemRows(trackIds: string[]): Promise<StemRow[]> {
    if (trackIds.length === 0) return [];
    return this.transactions.executor().select().from(stems).where(inArray(stems.trackId, trackIds));
  }

  private toRow(track: Track): typeof tracks.$inferInsert {
    const primitive = track.toPrimitive();
    return {
      id: primitive.id,
      userId: primitive.ownerId,
      title: primitive.title,
      originalFilename: primitive.originalFilename,
      contentType: primitive.mediaType,
      sizeBytes: primitive.sizeBytes,
      inputKey: primitive.inputKey,
      status: primitive.status,
      durationSeconds: primitive.durationSeconds,
      latestJobId: primitive.latestJobId,
      credit: primitive.credit,
      createdAt: new Date(primitive.createdAt),
    };
  }

  private toStemRow(trackId: string, stem: StemPrimitive): typeof stems.$inferInsert {
    return {
      trackId,
      name: stem.name,
      objectKey: stem.key,
      sizeBytes: stem.sizeBytes,
      silent: stem.silent,
      previewKey: stem.previewKey,
      peaksKey: stem.peaksKey,
      midiKey: stem.midiKey,
    };
  }

  private toDomain(row: TrackRow, stemRows: StemRow[]): Track {
    return Track.fromPrimitive({
      id: row.id,
      ownerId: row.userId,
      title: row.title,
      originalFilename: row.originalFilename,
      mediaType: row.contentType as MediaTypePrimitive,
      sizeBytes: row.sizeBytes,
      inputKey: row.inputKey,
      status: row.status as TrackStatusPrimitive,
      durationSeconds: row.durationSeconds,
      latestJobId: row.latestJobId,
      stems: stemRows.map((stem) => ({
        name: stem.name as StemNamePrimitive,
        key: stem.objectKey,
        sizeBytes: stem.sizeBytes,
        silent: stem.silent,
        previewKey: stem.previewKey,
        peaksKey: stem.peaksKey,
        midiKey: stem.midiKey,
      })),
      credit: row.credit,
      createdAt: row.createdAt.toISOString(),
    });
  }
}
