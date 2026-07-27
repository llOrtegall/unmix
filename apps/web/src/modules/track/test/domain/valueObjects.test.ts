import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import { CreatedAt } from "../../domain/CreatedAt.ts";
import { Credit } from "../../domain/Credit.ts";
import { Duration } from "../../domain/Duration.ts";
import { InvalidCreatedAtError } from "../../domain/errors/InvalidCreatedAtError.ts";
import { InvalidCreditError } from "../../domain/errors/InvalidCreditError.ts";
import { InvalidDurationError } from "../../domain/errors/InvalidDurationError.ts";
import { InvalidFileSizeError } from "../../domain/errors/InvalidFileSizeError.ts";
import { InvalidFilenameError } from "../../domain/errors/InvalidFilenameError.ts";
import { InvalidJobReferenceError } from "../../domain/errors/InvalidJobReferenceError.ts";
import { InvalidPageCursorError } from "../../domain/errors/InvalidPageCursorError.ts";
import { InvalidPeaksError } from "../../domain/errors/InvalidPeaksError.ts";
import { InvalidStemNameError } from "../../domain/errors/InvalidStemNameError.ts";
import { InvalidTrackIdError } from "../../domain/errors/InvalidTrackIdError.ts";
import { InvalidTrackStatusError } from "../../domain/errors/InvalidTrackStatusError.ts";
import { InvalidTrackTitleError } from "../../domain/errors/InvalidTrackTitleError.ts";
import { InvalidUrlError } from "../../domain/errors/InvalidUrlError.ts";
import { Filename } from "../../domain/Filename.ts";
import { FileSize } from "../../domain/FileSize.ts";
import { JobReference } from "../../domain/JobReference.ts";
import { PageCursor } from "../../domain/PageCursor.ts";
import { StemName } from "../../domain/StemName.ts";
import { TrackId } from "../../domain/TrackId.ts";
import { TrackStatus } from "../../domain/TrackStatus.ts";
import { TrackTitle } from "../../domain/TrackTitle.ts";
import { Url } from "../../domain/Url.ts";
import { WaveformPeaks } from "../../domain/WaveformPeaks.ts";

describe("track value objects", () => {
  describe("Basic behaviour", () => {
    it("survive a primitive round-trip", () => {
      const id = faker.string.uuid();
      const date = faker.date.recent().toISOString();

      expect(TrackId.fromPrimitive(id).toPrimitive()).toBe(id);
      expect(JobReference.fromPrimitive(id).toPrimitive()).toBe(id);
      expect(TrackTitle.fromPrimitive("La").toPrimitive()).toBe("La");
      expect(TrackStatus.fromPrimitive("uploaded").toPrimitive()).toBe("uploaded");
      expect(Duration.fromPrimitive(297.3).toPrimitive()).toBe(297.3);
      expect(Credit.fromPrimitive("CC BY 4.0").toPrimitive()).toBe("CC BY 4.0");
      expect(CreatedAt.fromPrimitive(date).toPrimitive()).toBe(date);
      expect(Url.fromPrimitive("https://s3.test/a.flac").toPrimitive()).toBe("https://s3.test/a.flac");
      expect(FileSize.fromPrimitive(0).toPrimitive()).toBe(0);
      expect(StemName.fromPrimitive("piano").toPrimitive()).toBe("piano");
      expect(PageCursor.fromPrimitive(date).toPrimitive()).toBe(date);
      expect(Filename.fromPrimitive("song.MP3").toPrimitive()).toBe("song.MP3");
      expect(WaveformPeaks.fromPrimitive([0, 0.5]).toPrimitive()).toEqual([0, 0.5]);
    });

    it("trims titles and credits", () => {
      expect(TrackTitle.create("  La  ").toPrimitive()).toBe("La");
      expect(Credit.create(" CC BY ").toPrimitive()).toBe("CC BY");
    });

    it("compares by value", () => {
      const id = faker.string.uuid();

      expect(TrackId.create(id).equals(TrackId.create(id))).toBe(true);
      expect(TrackStatus.create("failed").equals(TrackStatus.create("completed"))).toBe(false);
      expect(FileSize.create(10).equals(FileSize.create(10))).toBe(true);
      expect(WaveformPeaks.create([0.1]).equals(WaveformPeaks.create([0.2]))).toBe(false);
      expect(CreatedAt.create("2026-07-01T10:00:00.000Z").equals(CreatedAt.create("2026-07-01T10:00:00Z"))).toBe(true);
    });

    it("knows whether a track is separating or completed", () => {
      expect(TrackStatus.create("separating").isSeparating()).toBe(true);
      expect(TrackStatus.create("completed").isCompleted()).toBe(true);
      expect(TrackStatus.create("failed").isSeparating()).toBe(false);
    });

    it("orders stems as the mixer shows them", () => {
      expect(StemName.all().map((name) => name.toPrimitive())).toEqual(["vocals", "drums", "bass", "guitar", "piano", "other"]);
      expect(StemName.create("vocals").comesBefore(StemName.create("other"))).toBe(true);
      expect(StemName.create("piano").comesBefore(StemName.create("drums"))).toBe(false);
    });

    it("reads the extension of a filename", () => {
      expect(Filename.create("La Song.FLAC").extension()).toBe("flac");
      expect(Filename.create("noextension").extension()).toBe("");
    });

    it("compares sizes with a limit in megabytes", () => {
      expect(FileSize.create(201 * 1_048_576).exceeds(FileSize.megabytes(200))).toBe(true);
      expect(FileSize.megabytes(200).exceeds(FileSize.megabytes(200))).toBe(false);
    });

    it("finds the loudest peak", () => {
      expect(WaveformPeaks.create([0.2, 0.9, 0.4]).loudest()).toBe(0.9);
      expect(WaveformPeaks.empty().loudest()).toBe(0);
      expect(WaveformPeaks.empty().isEmpty()).toBe(true);
    });

    it("hands out copies of the creation date", () => {
      const createdAt = CreatedAt.create("2026-07-01T10:00:00.000Z");

      createdAt.toDate().setFullYear(1999);

      expect(createdAt.toPrimitive()).toBe("2026-07-01T10:00:00.000Z");
    });
  });

  describe("Edge cases", () => {
    it("accepts root-relative URLs for same-origin files", () => {
      expect(Url.create("/api/v1/tracks/t/download.zip").toPrimitive()).toBe("/api/v1/tracks/t/download.zip");
    });
  });

  describe("Error scenarios", () => {
    it.each([
      ["track id", () => TrackId.create("track-1"), InvalidTrackIdError],
      ["job reference", () => JobReference.create(""), InvalidJobReferenceError],
      ["title", () => TrackTitle.create("   "), InvalidTrackTitleError],
      ["status", () => TrackStatus.create("lost"), InvalidTrackStatusError],
      ["duration", () => Duration.create(-1), InvalidDurationError],
      ["infinite duration", () => Duration.create(Number.POSITIVE_INFINITY), InvalidDurationError],
      ["credit", () => Credit.create(" "), InvalidCreditError],
      ["date", () => CreatedAt.create("yesterday"), InvalidCreatedAtError],
      ["relative url", () => Url.create("tracks/a.flac"), InvalidUrlError],
      ["protocol-relative url", () => Url.create("//evil.test/a"), InvalidUrlError],
      ["size", () => FileSize.create(-5), InvalidFileSizeError],
      ["fractional size", () => FileSize.create(1.5), InvalidFileSizeError],
      ["stem", () => StemName.create("kazoo"), InvalidStemNameError],
      ["cursor", () => PageCursor.create(""), InvalidPageCursorError],
      ["filename", () => Filename.create(" "), InvalidFilenameError],
      ["peaks", () => WaveformPeaks.create([0.3, -0.1]), InvalidPeaksError],
    ])("rejects an invalid %s", (_, build, error) => {
      expect(build).toThrow(error);
    });
  });
});
