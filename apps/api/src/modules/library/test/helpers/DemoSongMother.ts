import { faker } from "@faker-js/faker";
import { DemoSong, type DemoSongPrimitive } from "../../domain/DemoSong.ts";
import * as StemMother from "./StemMother.ts";

export const createPrimitive = (overrides: Partial<DemoSongPrimitive> = {}): DemoSongPrimitive => ({
  title: faker.music.songName().slice(0, 100),
  originalFilename: "demo.mp3",
  contentType: "audio/mpeg",
  sizeBytes: faker.number.int({ min: 1, max: 10_000_000 }),
  inputKey: "demo/original.mp3",
  durationSeconds: faker.number.float({ min: 30, max: 300, fractionDigits: 1 }),
  credit: `Music: ${faker.music.songName()} by ${faker.person.fullName()}`,
  stems: [StemMother.createPrimitive({ name: "vocals", key: "demo/stems/vocals.flac" })],
  ...overrides,
});

export const create = (overrides: Partial<DemoSongPrimitive> = {}): DemoSong => DemoSong.fromPrimitive(createPrimitive(overrides));
