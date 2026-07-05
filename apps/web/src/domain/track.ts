import type { Stem } from "./stem.ts";

export type TrackStatus = "awaiting_upload" | "uploaded" | "separating" | "completed" | "failed";

export interface TrackSummary {
  id: string;
  title: string;
  status: TrackStatus;
  durationSeconds: number | null;
  createdAt: Date;
}

export interface Track extends TrackSummary {
  latestJobId: string | null;
  stems: Stem[];
}

export interface TrackPage {
  items: TrackSummary[];
  nextCursor: string | null;
}
