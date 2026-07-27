import { describe, expect, it, vi } from "vitest";
import { uploadTrack } from "../../application/uploadTrack.ts";
import { FileTooLargeError } from "../../domain/errors/FileTooLargeError.ts";
import { UnsupportedMediaTypeError } from "../../domain/errors/UnsupportedMediaTypeError.ts";
import { UploadCancelledError } from "../../domain/errors/UploadCancelledError.ts";
import { MediaType } from "../../domain/MediaType.ts";
import { UploadCandidate } from "../../domain/UploadCandidate.ts";
import { UploadProgress } from "../../domain/UploadProgress.ts";
import * as FileMother from "../helpers/FileMother.ts";
import * as TrackRepositoryMother from "../helpers/TrackRepositoryMother.ts";
import * as UploadRepositoryMother from "../helpers/UploadRepositoryMother.ts";

describe("uploadTrack", () => {
  it("uploads the file to its ticket, then asks for the separation", async () => {
    const ticket = TrackRepositoryMother.ticket();
    const trackRepository = TrackRepositoryMother.create({ createUpload: vi.fn().mockResolvedValue(ticket) });
    const uploadRepository = UploadRepositoryMother.create();
    const file = FileMother.create("video.mkv", "");
    const onProgress = vi.fn();
    const signal = new AbortController().signal;

    const trackId = await uploadTrack({ trackRepository, uploadRepository })({ file, onProgress, signal });

    expect(trackId).toBe(ticket.getTrackId());
    expect(trackRepository.createUpload).toHaveBeenCalledWith(UploadCandidate.fromFile(file));
    expect(uploadRepository.put).toHaveBeenCalledWith({ ticket, file, mediaType: MediaType.create("video/x-matroska"), onProgress, signal });
    expect(trackRepository.requestSeparation).toHaveBeenCalledWith(ticket.getTrackId());
    expect(onProgress.mock.calls.map(([progress]) => progress)).toEqual([UploadProgress.uploading(0), UploadProgress.requesting()]);
  });

  it.each([
    ["unsupported", FileMother.create("notes.pdf", "application/pdf"), UnsupportedMediaTypeError],
    ["too large", FileMother.create("a.wav", "audio/wav", 201 * 1_048_576), FileTooLargeError],
  ])("rejects an %s file before creating the upload", async (_, file, error) => {
    const trackRepository = TrackRepositoryMother.create();

    await expect(uploadTrack({ trackRepository, uploadRepository: UploadRepositoryMother.create() })({ file, onProgress: vi.fn() })).rejects.toThrow(
      error,
    );
    expect(trackRepository.createUpload).not.toHaveBeenCalled();
  });

  it("does not ask for the separation when the upload is cancelled", async () => {
    const trackRepository = TrackRepositoryMother.create();
    const uploadRepository = UploadRepositoryMother.create({ put: vi.fn().mockRejectedValue(new UploadCancelledError()) });

    await expect(uploadTrack({ trackRepository, uploadRepository })({ file: FileMother.create(), onProgress: vi.fn() })).rejects.toThrow(
      UploadCancelledError,
    );
    expect(trackRepository.requestSeparation).not.toHaveBeenCalled();
  });
});
