import { bigint, doublePrecision, index, boolean, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "../../identity/index.ts";

export const tracks = pgTable(
  "tracks",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    originalFilename: text("original_filename").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    inputKey: text("input_key").notNull(),
    status: text("status").notNull(),
    durationSeconds: doublePrecision("duration_seconds"),
    latestJobId: uuid("latest_job_id"),
    credit: text("credit"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("tracks_user_created_at_idx").on(t.userId, t.createdAt)],
);

export const stems = pgTable(
  "stems",
  {
    trackId: uuid("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    objectKey: text("object_key").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    silent: boolean("silent").notNull(),
    previewKey: text("preview_key").notNull(),
    peaksKey: text("peaks_key").notNull(),
  },
  (t) => [primaryKey({ columns: [t.trackId, t.name] })],
);
