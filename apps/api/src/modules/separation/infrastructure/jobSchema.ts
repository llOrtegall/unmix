import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { JobFailurePrimitive } from "../domain/JobFailure.ts";

export const separationJobs = pgTable(
  "separation_jobs",
  {
    id: uuid("id").primaryKey(),
    trackId: uuid("track_id").notNull(),
    model: text("model").notNull(),
    status: text("status").notNull(),
    stage: text("stage"),
    progress: integer("progress").notNull().default(0),
    failure: jsonb("failure").$type<JobFailurePrimitive>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [index("separation_jobs_status_idx").on(t.status), index("separation_jobs_track_idx").on(t.trackId)],
);
