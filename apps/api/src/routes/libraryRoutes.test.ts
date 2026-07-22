import { faker } from "@faker-js/faker";
import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";
import { errorHandler } from "../middlewares/errorHandler.ts";
import type { LibraryModule } from "../modules/library/application/factory.ts";
import { TrackNotFoundError } from "../modules/library/domain/errors/TrackNotFoundError.ts";
import { UnsupportedMediaTypeError } from "../modules/library/domain/errors/UnsupportedMediaTypeError.ts";
import { PlayableTrack } from "../modules/library/domain/PlayableTrack.ts";
import { StemArchive } from "../modules/library/domain/StemArchive.ts";
import { TrackList } from "../modules/library/domain/TrackList.ts";
import { TrackPage } from "../modules/library/domain/TrackPage.ts";
import { UploadTicket } from "../modules/library/domain/UploadTicket.ts";
import * as TrackMother from "../modules/library/test/helpers/TrackMother.ts";
import { libraryRoutes } from "./libraryRoutes.ts";

const userId = faker.string.uuid();

const appWith = (library: Partial<LibraryModule>) =>
  Fastify()
    .setErrorHandler(errorHandler)
    .addHook("preHandler", async (request) => {
      request.userId = userId;
    })
    .register(libraryRoutes(library as LibraryModule));

describe("libraryRoutes", () => {
  describe("POST /uploads", () => {
    it("responds 201 with the upload ticket for the signed-in user", async () => {
      const ticket = UploadTicket.fromPrimitive({
        trackId: faker.string.uuid(),
        uploadUrl: "https://storage.test/upload",
        expiresInSeconds: 900,
      });
      const registerUpload = vi.fn().mockResolvedValue(ticket);
      const body = { filename: "a.mp3", contentType: "audio/mpeg", sizeBytes: 10 };

      const response = await appWith({ registerUpload }).inject({ method: "POST", url: "/uploads", payload: body });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual({ trackId: ticket.toPrimitive().trackId, uploadUrl: "https://storage.test/upload", expiresIn: 900 });
      expect(registerUpload).toHaveBeenCalledWith({ ...body, ownerId: userId });
    });

    it("responds 400 when the body has the wrong shape", async () => {
      const response = await appWith({}).inject({ method: "POST", url: "/uploads", payload: { filename: 42 } });

      expect(response.statusCode).toBe(400);
    });

    it("responds 422 with the domain code when the type is not supported", async () => {
      const registerUpload = vi.fn().mockRejectedValue(new UnsupportedMediaTypeError("text/plain"));

      const response = await appWith({ registerUpload }).inject({
        method: "POST",
        url: "/uploads",
        payload: { filename: "a.txt", contentType: "text/plain", sizeBytes: 10 },
      });

      expect(response.statusCode).toBe(422);
      expect(response.json().code).toBe("track.unsupported_media_type");
    });
  });

  describe("GET /tracks", () => {
    it("lists track summaries with the next cursor", async () => {
      const track = TrackMother.completed();
      const page = TrackPage.fromPrimitive({ tracks: [track.toPrimitive()], nextCursor: "2026-07-01T12:00:00.000Z" });
      const listTracks = vi.fn().mockResolvedValue(page);

      const response = await appWith({ listTracks }).inject({ method: "GET", url: "/tracks?limit=5" });

      const { id, title, status, durationSeconds, credit, createdAt } = track.toPrimitive();
      expect(response.json()).toEqual({
        items: [{ trackId: id, title, status, durationSeconds, credit, createdAt }],
        nextCursor: "2026-07-01T12:00:00.000Z",
      });
      expect(listTracks).toHaveBeenCalledWith({ ownerId: userId, cursor: null, limit: 5 });
    });

    it("returns an empty page", async () => {
      const listTracks = vi.fn().mockResolvedValue(TrackPage.lastPage(TrackList.empty()));

      const response = await appWith({ listTracks }).inject({ method: "GET", url: "/tracks" });

      expect(response.json()).toEqual({ items: [], nextCursor: null });
    });
  });

  describe("GET /tracks/:trackId", () => {
    it("returns the track with signed stem URLs", async () => {
      const track = TrackMother.completed();
      const stems = track.toPrimitive().stems.map((stem) => ({
        stem,
        downloadUrl: `https://storage.test/${stem.key}`,
        previewUrl: `https://storage.test/${stem.previewKey}`,
        peaksUrl: `https://storage.test/${stem.peaksKey}`,
        midiUrl: null,
      }));
      const findTrack = vi.fn().mockResolvedValue(PlayableTrack.fromPrimitive({ track: track.toPrimitive(), stems }));

      const response = await appWith({ findTrack }).inject({ method: "GET", url: `/tracks/${track.toPrimitive().id}` });

      const [first] = track.toPrimitive().stems;
      expect(response.json()).toMatchObject({
        trackId: track.toPrimitive().id,
        latestJobId: track.toPrimitive().latestJobId,
        stems: expect.arrayContaining([
          { name: first!.name, url: `https://storage.test/${first!.key}`, previewUrl: expect.any(String), peaksUrl: expect.any(String), midiUrl: null, sizeBytes: first!.sizeBytes, silent: false },
        ]),
      });
    });

    it("responds 404 for a track the user cannot see", async () => {
      const findTrack = vi.fn().mockRejectedValue(new TrackNotFoundError("x"));

      const response = await appWith({ findTrack }).inject({ method: "GET", url: `/tracks/${faker.string.uuid()}` });

      expect(response.statusCode).toBe(404);
      expect(response.json().code).toBe("track.not_found");
    });

    it("responds 400 for an id that is not a UUID", async () => {
      const response = await appWith({}).inject({ method: "GET", url: "/tracks/abc" });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("DELETE /tracks/:trackId", () => {
    it("responds 204 after deleting the user's track", async () => {
      const deleteTrack = vi.fn().mockResolvedValue(undefined);
      const trackId = faker.string.uuid();

      const response = await appWith({ deleteTrack }).inject({ method: "DELETE", url: `/tracks/${trackId}` });

      expect(response.statusCode).toBe(204);
      expect(deleteTrack).toHaveBeenCalledWith(trackId, userId);
    });
  });

  describe("GET /tracks/:trackId/download.zip", () => {
    it("streams the archive as an attachment named after the track", async () => {
      const archive = StemArchive.forTrack(TrackMother.completed({ title: "La" }));
      const downloadStems = vi.fn().mockResolvedValue({ archive, content: new Blob(["zip-bytes"]).stream() });

      const response = await appWith({ downloadStems }).inject({ method: "GET", url: `/tracks/${faker.string.uuid()}/download.zip` });

      expect(response.headers["content-type"]).toBe("application/zip");
      expect(response.headers["content-disposition"]).toBe("attachment; filename*=UTF-8''La%20-%20stems.zip");
      expect(response.body).toBe("zip-bytes");
    });
  });
});
