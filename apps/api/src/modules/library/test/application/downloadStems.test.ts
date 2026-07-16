import { describe, expect, it, vi } from "vitest";
import { downloadStems } from "../../application/downloadStems.ts";
import { StemsNotReadyError } from "../../domain/errors/StemsNotReadyError.ts";
import * as StemArchiveRepositoryMother from "../helpers/StemArchiveRepositoryMother.ts";
import * as TrackMother from "../helpers/TrackMother.ts";
import * as TrackRepositoryMother from "../helpers/TrackRepositoryMother.ts";

describe("downloadStems", () => {
  it("packs the stems of a completed track", async () => {
    const track = TrackMother.completed({ title: "La" });
    const trackRepository = TrackRepositoryMother.create({ findById: vi.fn().mockResolvedValue(track) });
    const stemArchiveRepository = StemArchiveRepositoryMother.create();
    const { id, ownerId } = track.toPrimitive();

    const download = await downloadStems({ trackRepository, stemArchiveRepository })(id, ownerId);

    expect(download.archive.getFilename()).toBe("La - stems.zip");
    expect(stemArchiveRepository.pack).toHaveBeenCalledWith(download.archive);
  });

  it("refuses to pack a track that is still separating", async () => {
    const track = TrackMother.separating();
    const trackRepository = TrackRepositoryMother.create({ findById: vi.fn().mockResolvedValue(track) });
    const stemArchiveRepository = StemArchiveRepositoryMother.create();
    const { id, ownerId } = track.toPrimitive();

    await expect(downloadStems({ trackRepository, stemArchiveRepository })(id, ownerId)).rejects.toThrow(StemsNotReadyError);
    expect(stemArchiveRepository.pack).not.toHaveBeenCalled();
  });
});
