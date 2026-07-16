import { faker } from "@faker-js/faker";
import { describe, expect, it, vi } from "vitest";
import { addDemoTrack } from "../../application/addDemoTrack.ts";
import * as DemoSongMother from "../helpers/DemoSongMother.ts";
import * as DemoSongRepositoryMother from "../helpers/DemoSongRepositoryMother.ts";
import * as TrackRepositoryMother from "../helpers/TrackRepositoryMother.ts";

describe("addDemoTrack", () => {
  it("gives the user a completed copy that points at the shared demo files", async () => {
    const demo = DemoSongMother.create();
    const trackRepository = TrackRepositoryMother.create();
    const demoSongRepository = DemoSongRepositoryMother.create({ find: vi.fn().mockResolvedValue(demo) });
    const ownerId = faker.string.uuid();

    const track = await addDemoTrack({ trackRepository, demoSongRepository })(ownerId);

    expect(track?.toPrimitive()).toMatchObject({ ownerId, status: "completed", inputKey: demo.getInputKey().toPrimitive() });
    expect(trackRepository.save).toHaveBeenCalledWith(track);
  });

  it("does nothing until a demo is seeded", async () => {
    const trackRepository = TrackRepositoryMother.create();
    const demoSongRepository = DemoSongRepositoryMother.create();

    expect(await addDemoTrack({ trackRepository, demoSongRepository })(faker.string.uuid())).toBeNull();
    expect(trackRepository.save).not.toHaveBeenCalled();
  });
});
