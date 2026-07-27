import { describe, expect, it } from "vitest";
import { DuplicatedTrackError } from "../../domain/errors/DuplicatedTrackError.ts";
import { PageCursor } from "../../domain/PageCursor.ts";
import { Track } from "../../domain/Track.ts";
import { TrackList } from "../../domain/TrackList.ts";
import { TrackPage } from "../../domain/TrackPage.ts";
import { TrackSummary } from "../../domain/TrackSummary.ts";
import * as TrackMother from "../helpers/TrackMother.ts";
import * as TrackSummaryMother from "../helpers/TrackSummaryMother.ts";

describe("tracks", () => {
  describe("Basic behaviour", () => {
    it("survive a primitive round-trip", () => {
      const summary = TrackSummaryMother.createPrimitive({ credit: "CC BY 4.0" });
      const track = TrackMother.createPrimitive();

      expect(TrackSummary.fromPrimitive(summary).toPrimitive()).toEqual(summary);
      expect(Track.fromPrimitive(track).toPrimitive()).toEqual(track);
    });

    it("can be deleted unless they are being separated", () => {
      expect(TrackSummaryMother.create().canBeDeleted()).toBe(true);
      expect(TrackSummaryMother.separating().canBeDeleted()).toBe(false);
    });

    it("recognise the demo song by its credit", () => {
      expect(TrackSummaryMother.demo().isDemo()).toBe(true);
      expect(TrackSummaryMother.create().isDemo()).toBe(false);
    });

    it("are ready for the mixer once separated", () => {
      expect(TrackMother.create().isReady()).toBe(true);
      expect(TrackMother.separating().isReady()).toBe(false);
      expect(TrackMother.withoutJob().getLatestJob()).toBeNull();
    });

    it("compare by id", () => {
      const track = TrackMother.create();

      expect(track.equals(Track.fromPrimitive({ ...track.toPrimitive(), title: "Other" }))).toBe(true);
      expect(track.equals(TrackMother.create())).toBe(false);
    });
  });

  describe("TrackList", () => {
    it("knows whether any track is being separated", () => {
      expect(TrackList.create([TrackSummaryMother.create(), TrackSummaryMother.separating()]).hasSeparating()).toBe(true);
      expect(TrackList.create([TrackSummaryMother.create()]).hasSeparating()).toBe(false);
    });

    it("removes a track without changing the original list", () => {
      const kept = TrackSummaryMother.create();
      const removed = TrackSummaryMother.create();
      const list = TrackList.create([kept, removed]);

      const remaining = list.remove(removed.getId());

      expect(remaining.map((track) => track.getId())).toEqual([kept.getId()]);
      expect(list.count()).toBe(2);
    });

    it("appends the next page", () => {
      const first = TrackList.create([TrackSummaryMother.create()]);
      const second = TrackList.create([TrackSummaryMother.create()]);

      expect(first.append(second).count()).toBe(2);
      expect(TrackList.fromPrimitive(first.append(second).toPrimitive()).equals(first.append(second))).toBe(true);
      expect(TrackList.empty().isEmpty()).toBe(true);
    });

    it("rejects the same track twice", () => {
      const track = TrackSummaryMother.create();

      expect(() => TrackList.create([track, track])).toThrow(DuplicatedTrackError);
      expect(() => TrackList.create([track]).append(TrackList.create([track]))).toThrow(DuplicatedTrackError);
    });
  });

  describe("TrackPage", () => {
    it("has more tracks while there is a cursor", () => {
      const page = TrackPage.create(TrackList.create([TrackSummaryMother.create()]), PageCursor.create("2026-07-01T10:00:00.000Z"));

      expect(page.hasMore()).toBe(true);
      expect(TrackPage.create(TrackList.empty(), null).hasMore()).toBe(false);
      expect(TrackPage.fromPrimitive(page.toPrimitive()).equals(page)).toBe(true);
      expect(page.equals(TrackPage.create(page.getTracks(), null))).toBe(false);
    });
  });
});
