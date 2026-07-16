import { faker } from "@faker-js/faker";
import { Track, type TrackPrimitive } from "../../domain/Track.ts";
import * as StemMother from "./StemMother.ts";

export const createPrimitive = (overrides: Partial<TrackPrimitive> = {}): TrackPrimitive => {
  const id = overrides.id ?? faker.string.uuid();
  const title = faker.music.songName().slice(0, 100);
  return {
    id,
    ownerId: faker.string.uuid(),
    title,
    originalFilename: `${title}.mp3`,
    mediaType: "audio/mpeg",
    sizeBytes: faker.number.int({ min: 1, max: 100_000_000 }),
    inputKey: `tracks/${id}/original.mp3`,
    status: "awaiting_upload",
    durationSeconds: null,
    latestJobId: null,
    stems: [],
    credit: null,
    createdAt: faker.date.recent().toISOString(),
    ...overrides,
  };
};

export const create = (overrides: Partial<TrackPrimitive> = {}): Track => Track.fromPrimitive(createPrimitive(overrides));

export const separating = (overrides: Partial<TrackPrimitive> = {}): Track =>
  create({ status: "separating", latestJobId: faker.string.uuid(), ...overrides });

export const completed = (overrides: Partial<TrackPrimitive> = {}): Track =>
  create({
    status: "completed",
    latestJobId: faker.string.uuid(),
    durationSeconds: faker.number.float({ min: 30, max: 600, fractionDigits: 1 }),
    stems: StemMother.listPrimitive(),
    ...overrides,
  });

export const failed = (overrides: Partial<TrackPrimitive> = {}): Track =>
  create({ status: "failed", latestJobId: faker.string.uuid(), ...overrides });
