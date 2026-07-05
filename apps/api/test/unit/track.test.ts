import { describe, expect, it } from "vitest";
import { Track } from "../../src/modules/library/domain/track.ts";

const base = { id: "t1", filename: "My Song.mp3", contentType: "audio/mpeg", sizeBytes: 1000, maxSizeBytes: 5000, now: new Date() };
const stems = [{ name: "vocals" as const, key: "k/vocals.flac", sizeBytes: 10, silent: false, previewKey: "p", peaksKey: "w" }];

describe("Track", () => {
  it("registers with a title and an input key derived from the media type", () => {
    const t = Track.register(base)._unsafeUnwrap().toSnapshot();
    expect(t.title).toBe("My Song");
    expect(t.inputKey).toBe("tracks/t1/original.mp3");
    expect(t.status).toBe("awaiting_upload");
  });

  it("rejects unsupported types and oversized files", () => {
    expect(Track.register({ ...base, contentType: "text/plain" })._unsafeUnwrapErr().code).toBe("UNSUPPORTED_MEDIA_TYPE");
    expect(Track.register({ ...base, sizeBytes: 9999 })._unsafeUnwrapErr().code).toBe("FILE_TOO_LARGE");
  });

  it("goes through a separation and ignores duplicate or stale completions", () => {
    const track = Track.register(base)._unsafeUnwrap();
    expect(track.startSeparation("j1").isOk()).toBe(true);
    expect(track.startSeparation("j2")._unsafeUnwrapErr().code).toBe("TRACK_BUSY");
    expect(track.canDelete().isErr()).toBe(true);

    expect(track.completeSeparation("other-job", 10, stems).isOk()).toBe(true);
    expect(track.toSnapshot().status).toBe("separating");

    expect(track.completeSeparation("j1", 297, stems).isOk()).toBe(true);
    expect(track.completeSeparation("j1", 297, stems).isOk()).toBe(true);
    expect(track.toSnapshot()).toMatchObject({ status: "completed", durationSeconds: 297 });
    expect(track.canDelete().isOk()).toBe(true);
  });

  it("allows a retry after a failed separation", () => {
    const track = Track.register(base)._unsafeUnwrap();
    track.startSeparation("j1");
    track.failSeparation("j1");
    expect(track.toSnapshot().status).toBe("failed");
    expect(track.startSeparation("j2").isOk()).toBe(true);
  });
});
