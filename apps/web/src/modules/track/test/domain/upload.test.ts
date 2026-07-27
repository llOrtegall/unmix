import { describe, expect, it } from "vitest";
import { FileTooLargeError } from "../../domain/errors/FileTooLargeError.ts";
import { InvalidUploadProgressError } from "../../domain/errors/InvalidUploadProgressError.ts";
import { UnsupportedMediaTypeError } from "../../domain/errors/UnsupportedMediaTypeError.ts";
import { MediaType } from "../../domain/MediaType.ts";
import { UploadCandidate } from "../../domain/UploadCandidate.ts";
import { UploadProgress } from "../../domain/UploadProgress.ts";
import { UploadTicket } from "../../domain/UploadTicket.ts";
import * as TrackRepositoryMother from "../helpers/TrackRepositoryMother.ts";

const MB = 1_048_576;

describe("upload", () => {
  describe("Basic behaviour", () => {
    it("takes the media type the browser reports", () => {
      const candidate = UploadCandidate.fromFile({ name: "song.mp3", type: "audio/mpeg", size: 10 * MB });

      expect(candidate.toPrimitive()).toEqual({ filename: "song.mp3", mediaType: "audio/mpeg", sizeBytes: 10 * MB });
      expect(UploadCandidate.fromPrimitive(candidate.toPrimitive()).equals(candidate)).toBe(true);
    });

    it("lists every accepted MIME type and extension for the file picker", () => {
      expect(MediaType.acceptedFormats()).toEqual(expect.arrayContaining(["audio/mpeg", "video/x-matroska", ".mkv", ".flac"]));
    });

    it("reports upload progress as a percentage, then the separation request", () => {
      expect(UploadProgress.uploading(0.426).percent()).toBe(43);
      expect(UploadProgress.uploading(0.5).isRequesting()).toBe(false);
      expect(UploadProgress.requesting().isRequesting()).toBe(true);
      expect(UploadProgress.requesting().percent()).toBe(100);
      expect(UploadProgress.fromPrimitive(UploadProgress.uploading(0.2).toPrimitive()).equals(UploadProgress.uploading(0.2))).toBe(true);
    });

    it("survives a ticket round-trip", () => {
      const ticket = TrackRepositoryMother.ticket();

      expect(UploadTicket.fromPrimitive(ticket.toPrimitive()).equals(ticket)).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it.each([
      ["video.mkv", "", "video/x-matroska"],
      ["take.m4a", "application/octet-stream", "audio/mp4"],
      ["voice.WAV", "", "audio/wav"],
    ])("falls back to the extension of %s", (name, type, expected) => {
      expect(UploadCandidate.fromFile({ name, type, size: MB }).getMediaType().toPrimitive()).toBe(expected);
    });

    it("accepts a file right at the size limit", () => {
      expect(() => UploadCandidate.fromFile({ name: "a.mp3", type: "audio/mpeg", size: UploadCandidate.MAX_MEGABYTES * MB })).not.toThrow();
    });
  });

  describe("Error scenarios", () => {
    it("rejects files that are not audio or video", () => {
      expect(() => UploadCandidate.fromFile({ name: "notes.pdf", type: "application/pdf", size: MB })).toThrow(UnsupportedMediaTypeError);
      expect(() => UploadCandidate.fromFile({ name: "notes", type: "", size: MB })).toThrow(UnsupportedMediaTypeError);
    });

    it("rejects files over the size limit", () => {
      expect(() => UploadCandidate.fromFile({ name: "a.wav", type: "audio/wav", size: 201 * MB })).toThrow(FileTooLargeError);
    });

    it("rejects progress outside 0..1", () => {
      expect(() => UploadProgress.uploading(1.2)).toThrow(InvalidUploadProgressError);
      expect(() => UploadProgress.uploading(Number.NaN)).toThrow(InvalidUploadProgressError);
    });
  });
});
