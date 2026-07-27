import { faker } from "@faker-js/faker";
import { Track, type TrackPrimitive } from "../../domain/Track.ts";
import * as StemMother from "./StemMother.ts";
import * as TrackSummaryMother from "./TrackSummaryMother.ts";

export const createPrimitive = (overrides: Partial<TrackPrimitive> = {}): TrackPrimitive => {
  const summary = TrackSummaryMother.createPrimitive(overrides);
  return {
    ...summary,
    latestJobId: faker.string.uuid(),
    stems: StemMother.listPrimitive(),
    archiveUrl: `/api/v1/tracks/${summary.id}/download.zip`,
    ...overrides,
  };
};

export const create = (overrides: Partial<TrackPrimitive> = {}): Track => Track.fromPrimitive(createPrimitive(overrides));

export const separating = (overrides: Partial<TrackPrimitive> = {}): Track =>
  create({ status: "separating", durationSeconds: null, stems: [], ...overrides });

export const withoutJob = (overrides: Partial<TrackPrimitive> = {}): Track =>
  create({ status: "awaiting_upload", latestJobId: null, durationSeconds: null, stems: [], ...overrides });
