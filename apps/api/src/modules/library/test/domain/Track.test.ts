import { faker } from "@faker-js/faker";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JobId } from "../../../shared/domain/JobId.ts";
import { UserId } from "../../../shared/domain/UserId.ts";
import { InvalidTrackStatusError } from "../../domain/errors/InvalidTrackStatusError.ts";
import { FileTooLargeError } from "../../domain/errors/FileTooLargeError.ts";
import { InvalidTrackTransitionError } from "../../domain/errors/InvalidTrackTransitionError.ts";
import { StemsNotReadyError } from "../../domain/errors/StemsNotReadyError.ts";
import { TrackBusyError } from "../../domain/errors/TrackBusyError.ts";
import { FileSize } from "../../domain/FileSize.ts";
import { MediaType } from "../../domain/MediaType.ts";
import { OriginalFilename } from "../../domain/OriginalFilename.ts";
import { StemList } from "../../domain/StemList.ts";
import { Track } from "../../domain/Track.ts";
import { TrackDuration } from "../../domain/TrackDuration.ts";
import * as DemoSongMother from "../helpers/DemoSongMother.ts";
import * as StemMother from "../helpers/StemMother.ts";
import * as TrackMother from "../helpers/TrackMother.ts";

const registration = (sizeBytes = 1_000) => ({
  ownerId: UserId.generate(),
  filename: OriginalFilename.create("My Song.mp3"),
  mediaType: MediaType.create("audio/mpeg"),
  size: FileSize.create(sizeBytes),
  uploadLimit: FileSize.create(5_000),
});

const outcomeFor = (jobId: string | null) => ({
  jobId: JobId.fromPrimitive(jobId ?? faker.string.uuid()),
  duration: TrackDuration.create(297),
  stems: StemList.fromPrimitive(StemMother.listPrimitive()),
});

describe("Track", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Basic behaviour", () => {
    it("survives a primitive round-trip", () => {
      const primitive = TrackMother.createPrimitive({ stems: StemMother.listPrimitive(), credit: "Music: La" });

      expect(Track.fromPrimitive(primitive).toPrimitive()).toEqual(primitive);
    });

    it("registers an upload with a title and an input key inside its folder", () => {
      const track = Track.register(registration()).toPrimitive();

      expect(track).toMatchObject({ title: "My Song", status: "awaiting_upload", stems: [], latestJobId: null });
      expect(track.inputKey).toBe(`tracks/${track.id}/original.mp3`);
    });

    it("belongs to the user who registered it", () => {
      const input = registration();
      const track = Track.register(input);

      expect(track.isOwnedBy(input.ownerId)).toBe(true);
      expect(track.isOwnedBy(UserId.generate())).toBe(false);
    });

    it("copies the demo song as a completed track that points at the shared files", () => {
      const demo = DemoSongMother.create();
      const ownerId = UserId.generate();

      const track = Track.fromDemo(ownerId, demo).toPrimitive();

      expect(track).toMatchObject({
        ownerId: ownerId.toPrimitive(),
        status: "completed",
        inputKey: demo.getInputKey().toPrimitive(),
        credit: demo.getCredit().toPrimitive(),
        stems: demo.getStems().toPrimitive(),
      });
    });

    it("keeps its stems under its own folder", () => {
      const track = TrackMother.create();

      expect(track.getStemsPrefix().toPrimitive()).toBe(`tracks/${track.getId().toPrimitive()}/stems`);
      expect(track.getFolder().getTrackId().equals(track.getId())).toBe(true);
    });

    it("starts a separation and leaves the original untouched", () => {
      const track = TrackMother.failed();
      const jobId = JobId.generate();

      const started = track.startSeparation(jobId);

      expect(started.toPrimitive()).toMatchObject({ status: "separating", latestJobId: jobId.toPrimitive(), stems: [] });
      expect(track.toPrimitive().status).toBe("failed");
    });

    it("completes the latest separation with its stems and duration", () => {
      const track = TrackMother.separating();
      const outcome = outcomeFor(track.toPrimitive().latestJobId);

      const completed = track.completeSeparation(outcome).toPrimitive();

      expect(completed).toMatchObject({ status: "completed", durationSeconds: 297, stems: outcome.stems.toPrimitive() });
    });

    it("fails the latest separation and allows a retry", () => {
      const track = TrackMother.separating();

      const failed = track.failSeparation(JobId.fromPrimitive(track.toPrimitive().latestJobId!));

      expect(failed.toPrimitive().status).toBe("failed");
      expect(() => failed.ensureCanStartSeparation()).not.toThrow();
    });

    it("computes the abandoned upload cutoff from the clock", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-07-02T12:00:00Z"));

      expect(Track.abandonedUploadCutoff().toPrimitive()).toBe("2026-07-01T12:00:00.000Z");
    });

    it("is equal to another track with the same id", () => {
      const primitive = TrackMother.createPrimitive();

      expect(Track.fromPrimitive(primitive).equals(Track.fromPrimitive({ ...primitive, title: "Other" }))).toBe(true);
      expect(Track.fromPrimitive(primitive).equals(TrackMother.create())).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("ignores the completion of a stale job", () => {
      const track = TrackMother.separating();

      expect(track.completeSeparation(outcomeFor(null))).toBe(track);
    });

    it("ignores a duplicated completion", () => {
      const track = TrackMother.completed();

      expect(track.completeSeparation(outcomeFor(track.toPrimitive().latestJobId))).toBe(track);
    });

    it("ignores the failure of a stale or finished job", () => {
      const separating = TrackMother.separating();
      const completed = TrackMother.completed();

      expect(separating.failSeparation(JobId.generate())).toBe(separating);
      expect(completed.failSeparation(JobId.fromPrimitive(completed.toPrimitive().latestJobId!))).toBe(completed);
    });

    it("accepts a file exactly at the upload limit", () => {
      expect(() => Track.register(registration(5_000))).not.toThrow();
    });
  });

  describe("Error scenarios", () => {
    it("rejects a file over the upload limit", () => {
      expect(() => Track.register(registration(5_001))).toThrow(FileTooLargeError);
    });

    it("cannot start a second separation while one is running", () => {
      expect(() => TrackMother.separating().startSeparation(JobId.generate())).toThrow(TrackBusyError);
    });

    it("cannot complete a separation it is not running", () => {
      const track = TrackMother.failed();

      expect(() => track.completeSeparation(outcomeFor(track.toPrimitive().latestJobId))).toThrow(
        InvalidTrackTransitionError,
      );
    });

    it("cannot be deleted while separating", () => {
      expect(() => TrackMother.separating().ensureCanBeDeleted()).toThrow(TrackBusyError);
      expect(() => TrackMother.completed().ensureCanBeDeleted()).not.toThrow();
    });

    it("has no stems to download until it is completed", () => {
      expect(() => TrackMother.separating().ensureStemsAreReady()).toThrow(StemsNotReadyError);
      expect(() => TrackMother.completed().ensureStemsAreReady()).not.toThrow();
    });

    it("rejects invalid data when rehydrating", () => {
      expect(() => Track.fromPrimitive({ ...TrackMother.createPrimitive(), status: "paused" as "failed" })).toThrow(
        InvalidTrackStatusError,
      );
    });
  });
});
