import { faker } from "@faker-js/faker";
import { describe, expect, it, vi } from "vitest";
import { deleteTrack } from "../../application/deleteTrack.ts";
import { findTrack } from "../../application/findTrack.ts";
import { listTracks } from "../../application/listTracks.ts";
import { InvalidTrackIdError } from "../../domain/errors/InvalidTrackIdError.ts";
import { TrackNotFoundError } from "../../domain/errors/TrackNotFoundError.ts";
import { PageCursor } from "../../domain/PageCursor.ts";
import { TrackId } from "../../domain/TrackId.ts";
import { TrackList } from "../../domain/TrackList.ts";
import { TrackPage } from "../../domain/TrackPage.ts";
import { Waveforms } from "../../domain/Waveforms.ts";
import * as PeaksRepositoryMother from "../helpers/PeaksRepositoryMother.ts";
import * as TrackMother from "../helpers/TrackMother.ts";
import * as TrackRepositoryMother from "../helpers/TrackRepositoryMother.ts";
import * as TrackSummaryMother from "../helpers/TrackSummaryMother.ts";

describe("listTracks", () => {
  it("asks for the first page without a cursor", async () => {
    const page = TrackPage.create(TrackList.create([TrackSummaryMother.create()]), null);
    const trackRepository = TrackRepositoryMother.create({ list: vi.fn().mockResolvedValue(page) });

    expect(await listTracks({ trackRepository })()).toBe(page);
    expect(trackRepository.list).toHaveBeenCalledWith(null);
  });

  it("asks for the page after a cursor", async () => {
    const trackRepository = TrackRepositoryMother.create();
    const cursor = faker.date.recent().toISOString();

    await listTracks({ trackRepository })(cursor);

    expect(trackRepository.list).toHaveBeenCalledWith(PageCursor.create(cursor));
  });
});

describe("findTrack", () => {
  it("returns the track with the waveforms of its stems", async () => {
    const track = TrackMother.create();
    const waveforms = Waveforms.fromPrimitive({ vocals: [0.1, 0.4] });
    const trackRepository = TrackRepositoryMother.create({ findById: vi.fn().mockResolvedValue(track) });
    const peaksRepository = PeaksRepositoryMother.create({ findForStems: vi.fn().mockResolvedValue(waveforms) });

    const found = await findTrack({ trackRepository, peaksRepository })(track.getSummary().getId().toPrimitive());

    expect(found).toEqual({ track, waveforms });
    expect(peaksRepository.findForStems).toHaveBeenCalledWith(track.getStems());
  });

  it("throws when the track does not exist", async () => {
    const peaksRepository = PeaksRepositoryMother.create();

    await expect(findTrack({ trackRepository: TrackRepositoryMother.create(), peaksRepository })(faker.string.uuid())).rejects.toThrow(
      TrackNotFoundError,
    );
    expect(peaksRepository.findForStems).not.toHaveBeenCalled();
  });

  it("rejects an id that is not a track id before asking", async () => {
    const trackRepository = TrackRepositoryMother.create();

    await expect(findTrack({ trackRepository, peaksRepository: PeaksRepositoryMother.create() })("nope")).rejects.toThrow(InvalidTrackIdError);
    expect(trackRepository.findById).not.toHaveBeenCalled();
  });
});

describe("deleteTrack", () => {
  it("deletes the track", async () => {
    const trackRepository = TrackRepositoryMother.create();
    const id = faker.string.uuid();

    await deleteTrack({ trackRepository })(id);

    expect(trackRepository.delete).toHaveBeenCalledWith(TrackId.create(id));
  });
});
