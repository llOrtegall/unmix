import { faker } from "@faker-js/faker";
import { Stem, type StemPrimitive } from "../../domain/Stem.ts";
import { StemList, type StemListPrimitive } from "../../domain/StemList.ts";
import type { StemNamePrimitive } from "../../domain/StemName.ts";

const NAMES: readonly StemNamePrimitive[] = ["vocals", "drums", "bass", "guitar", "piano", "other"];

export const createPrimitive = (overrides: Partial<StemPrimitive> = {}): StemPrimitive => {
  const name = overrides.name ?? faker.helpers.arrayElement(NAMES);
  const base = `https://s3.test/tracks/${faker.string.uuid()}/stems/${name}`;
  return {
    name,
    downloadUrl: `${base}.flac`,
    previewUrl: `${base}.preview.mp3`,
    peaksUrl: `${base}.peaks.json`,
    midiUrl: name === "drums" ? null : `${base}.mid`,
    sizeBytes: faker.number.int({ min: 1, max: 50_000_000 }),
    silent: false,
    ...overrides,
  };
};

export const create = (overrides: Partial<StemPrimitive> = {}): Stem => Stem.fromPrimitive(createPrimitive(overrides));

export const listPrimitive = (names: readonly StemNamePrimitive[] = NAMES): StemListPrimitive =>
  names.map((name) => createPrimitive({ name }));

export const list = (names: readonly StemNamePrimitive[] = NAMES): StemList => StemList.fromPrimitive(listPrimitive(names));
