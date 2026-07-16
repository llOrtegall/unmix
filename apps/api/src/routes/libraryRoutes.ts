import { CreateUploadRequest, ListTracksQuery, type TrackDetail, type TrackSummary } from "@unmix/contracts";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { LibraryModule } from "../modules/library/application/factory.ts";
import type { PlayableTrackPrimitive } from "../modules/library/domain/PlayableTrack.ts";
import type { TrackPrimitive } from "../modules/library/domain/Track.ts";

const TrackParams = z.object({ trackId: z.uuid() });

const toTrackSummary = (track: TrackPrimitive): TrackSummary => ({
  trackId: track.id,
  title: track.title,
  status: track.status,
  durationSeconds: track.durationSeconds,
  credit: track.credit,
  createdAt: track.createdAt,
});

const toTrackDetail = ({ track, stems }: PlayableTrackPrimitive): TrackDetail => ({
  ...toTrackSummary(track),
  latestJobId: track.latestJobId,
  stems: stems.map(({ stem, downloadUrl, previewUrl, peaksUrl, midiUrl }) => ({
    name: stem.name,
    url: downloadUrl,
    previewUrl,
    peaksUrl,
    midiUrl,
    sizeBytes: stem.sizeBytes,
    silent: stem.silent,
  })),
});

const attachment = (filename: string): string => `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`;

export const libraryRoutes =
  (library: LibraryModule): FastifyPluginAsync =>
  async (app) => {
    app.post("/uploads", async (request, reply) => {
      const ticket = await library.registerUpload({ ...CreateUploadRequest.parse(request.body), ownerId: request.userId });
      const { trackId, uploadUrl, expiresInSeconds } = ticket.toPrimitive();
      return reply.status(201).send({ trackId, uploadUrl, expiresIn: expiresInSeconds });
    });

    app.get("/tracks", async (request) => {
      const { cursor, limit } = ListTracksQuery.parse(request.query);
      const page = await library.listTracks({ ownerId: request.userId, cursor: cursor ?? null, limit });
      const { tracks, nextCursor } = page.toPrimitive();
      return { items: tracks.map(toTrackSummary), nextCursor };
    });

    app.get("/tracks/:trackId", async (request) => {
      const { trackId } = TrackParams.parse(request.params);
      return toTrackDetail((await library.findTrack(trackId, request.userId)).toPrimitive());
    });

    app.delete("/tracks/:trackId", async (request, reply) => {
      const { trackId } = TrackParams.parse(request.params);
      await library.deleteTrack(trackId, request.userId);
      return reply.status(204).send();
    });

    app.get("/tracks/:trackId/download.zip", async (request, reply) => {
      const { trackId } = TrackParams.parse(request.params);
      const { archive, content } = await library.downloadStems(trackId, request.userId);
      return reply
        .header("content-type", "application/zip")
        .header("content-disposition", attachment(archive.getFilename()))
        .send(content);
    });
  };
