import { faker } from "@faker-js/faker";
import { describe, expect, it, vi } from "vitest";
import { completeTrackSeparation } from "../../application/completeTrackSeparation.ts";
import { failTrackSeparation } from "../../application/failTrackSeparation.ts";
import { startTrackSeparation } from "../../application/startTrackSeparation.ts";
import { TrackBusyError } from "../../domain/errors/TrackBusyError.ts";
import { TrackNotFoundError } from "../../domain/errors/TrackNotFoundError.ts";
import type { Track } from "../../domain/Track.ts";
import * as StemMother from "../helpers/StemMother.ts";
import * as TrackMother from "../helpers/TrackMother.ts";
import * as TrackRepositoryMother from "../helpers/TrackRepositoryMother.ts";

const repositoryWith = (track: Track | null) => TrackRepositoryMother.create({ findById: vi.fn().mockResolvedValue(track) });

describe("startTrackSeparation", () => {
  it("marks the track as separating with the new job", async () => {
    const trackRepository = repositoryWith(TrackMother.create());
    const jobId = faker.string.uuid();

    const track = await startTrackSeparation({ trackRepository })({ trackId: faker.string.uuid(), jobId });

    expect(track.toPrimitive()).toMatchObject({ status: "separating", latestJobId: jobId });
    expect(trackRepository.save).toHaveBeenCalledWith(track);
  });

  it("aborts when the track is busy", async () => {
    const trackRepository = repositoryWith(TrackMother.separating());

    await expect(
      startTrackSeparation({ trackRepository })({ trackId: faker.string.uuid(), jobId: faker.string.uuid() }),
    ).rejects.toThrow(TrackBusyError);
    expect(trackRepository.save).not.toHaveBeenCalled();
  });

  it("aborts when the track is gone", async () => {
    await expect(
      startTrackSeparation({ trackRepository: repositoryWith(null) })({ trackId: faker.string.uuid(), jobId: faker.string.uuid() }),
    ).rejects.toThrow(TrackNotFoundError);
  });
});

describe("completeTrackSeparation", () => {
  it("stores the stems and the duration of the latest job", async () => {
    const separating = TrackMother.separating();
    const trackRepository = repositoryWith(separating);
    const stems = StemMother.listPrimitive();

    const track = await completeTrackSeparation({ trackRepository })({
      trackId: separating.toPrimitive().id,
      jobId: separating.toPrimitive().latestJobId!,
      durationSeconds: 297.3,
      stems,
    });

    expect(track.toPrimitive()).toMatchObject({ status: "completed", durationSeconds: 297.3, stems });
    expect(trackRepository.save).toHaveBeenCalledWith(track);
  });
});

describe("failTrackSeparation", () => {
  it("marks the track as failed when its latest job fails", async () => {
    const separating = TrackMother.separating();
    const trackRepository = repositoryWith(separating);

    const track = await failTrackSeparation({ trackRepository })({
      trackId: separating.toPrimitive().id,
      jobId: separating.toPrimitive().latestJobId!,
    });

    expect(track.toPrimitive().status).toBe("failed");
  });
});
