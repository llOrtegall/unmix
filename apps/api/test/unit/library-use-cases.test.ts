import { describe, expect, it } from "vitest";
import { CollectGarbage } from "../../src/modules/library/application/use-cases/collect-garbage.ts";
import { Track } from "../../src/modules/library/domain/track.ts";
import { clock, InMemoryStorage, InMemoryTracks } from "./fakes.ts";

const HOUR = 3_600_000;
const ids = {
  fresh: "00000000-0000-4000-8000-000000000001",
  abandoned: "00000000-0000-4000-8000-000000000002",
  done: "00000000-0000-4000-8000-000000000003",
  orphan: "00000000-0000-4000-8000-000000000004",
};

function track(id: string, ageHours: number) {
  const now = new Date(clock.now().getTime() - ageHours * HOUR);
  return Track.register({ id, ownerId: "u1", filename: "a.mp3", contentType: "audio/mpeg", sizeBytes: 1, maxSizeBytes: 10, now })._unsafeUnwrap();
}

describe("CollectGarbage", () => {
  it("drops abandoned uploads and orphan folders, and keeps everything else", async () => {
    const tracks = new InMemoryTracks();
    const storage = new InMemoryStorage();
    await tracks.save(track(ids.fresh, 1));
    await tracks.save(track(ids.abandoned, 30));
    const done = track(ids.done, 30 * 24);
    done.startSeparation("j1")._unsafeUnwrap();
    await tracks.save(done);
    for (const id of Object.values(ids)) storage.keys.add(`tracks/${id}/original.mp3`);
    storage.keys.add("demo/stems/vocals.flac");
    storage.keys.add("tracks/not-a-track/file");

    const result = await new CollectGarbage({ tracks, storage, clock, abandonAfterMs: 24 * HOUR }).execute();

    expect(result).toEqual({ abandonedUploads: 1, orphanFolders: 2 });
    expect([...tracks.rows.keys()].sort()).toEqual([ids.fresh, ids.done]);
    expect([...storage.keys].sort()).toEqual([
      "demo/stems/vocals.flac",
      `tracks/${ids.fresh}/original.mp3`,
      `tracks/${ids.done}/original.mp3`,
      "tracks/not-a-track/file",
    ].sort());
  });
});
