import { faker } from "@faker-js/faker";
import { Stem, type StemPrimitive } from "../../domain/Stem.ts";
import type { StemNamePrimitive } from "../../domain/StemName.ts";

export const createPrimitive = (overrides: Partial<StemPrimitive> = {}): StemPrimitive => {
  const name = overrides.name ?? "vocals";
  const folder = `tracks/${faker.string.uuid()}/stems`;
  return {
    name,
    key: `${folder}/${name}.flac`,
    sizeBytes: faker.number.int({ min: 1, max: 50_000_000 }),
    silent: false,
    previewKey: `${folder}/${name}.preview.mp3`,
    peaksKey: `${folder}/${name}.peaks.json`,
    midiKey: `${folder}/${name}.mid`,
    ...overrides,
  };
};

export const create = (overrides: Partial<StemPrimitive> = {}): Stem => Stem.fromPrimitive(createPrimitive(overrides));

export const withoutMidi = (name: StemNamePrimitive = "drums"): Stem => create({ name, midiKey: null });

export const listPrimitive = (names: readonly StemNamePrimitive[] = ["vocals", "drums", "bass"]): StemPrimitive[] =>
  names.map((name) => createPrimitive({ name }));
