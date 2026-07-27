import { faker } from "@faker-js/faker";
import { TrackSummary, type TrackSummaryPrimitive } from "../../domain/TrackSummary.ts";

export const createPrimitive = (overrides: Partial<TrackSummaryPrimitive> = {}): TrackSummaryPrimitive => ({
  id: faker.string.uuid(),
  title: faker.music.songName(),
  status: "completed",
  durationSeconds: faker.number.float({ min: 30, max: 600, fractionDigits: 1 }),
  credit: null,
  createdAt: faker.date.recent().toISOString(),
  ...overrides,
});

export const create = (overrides: Partial<TrackSummaryPrimitive> = {}): TrackSummary =>
  TrackSummary.fromPrimitive(createPrimitive(overrides));

export const separating = (overrides: Partial<TrackSummaryPrimitive> = {}): TrackSummary =>
  create({ status: "separating", durationSeconds: null, ...overrides });

export const demo = (overrides: Partial<TrackSummaryPrimitive> = {}): TrackSummary =>
  create({ credit: `"La" by Someone, CC BY 4.0, https://example.test/la`, ...overrides });
