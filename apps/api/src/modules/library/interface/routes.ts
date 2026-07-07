import { ZipArchive } from "archiver";
import { CreateUploadRequest, ListTracksQuery } from "@unmix/contracts";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { parse, sendError } from "../../../shared/interface/http.ts";
import type { DeleteTrack } from "../application/use-cases/delete-track.ts";
import type { DownloadStems } from "../application/use-cases/download-stems.ts";
import type { GetTrack, ListTracks } from "../application/use-cases/queries.ts";
import type { RegisterUpload } from "../application/use-cases/register-upload.ts";

const TrackParams = z.object({ trackId: z.uuid() });

export interface LibraryUseCases {
  registerUpload: RegisterUpload;
  getTrack: GetTrack;
  listTracks: ListTracks;
  deleteTrack: DeleteTrack;
  downloadStems: DownloadStems;
}

export function libraryRoutes(app: FastifyInstance, uc: LibraryUseCases): void {
  app.post("/uploads", async (req, reply) => {
    const input = parse(CreateUploadRequest, req.body);
    if (input.isErr()) return sendError(reply, input.error);
    const result = await uc.registerUpload.execute({ ...input.value, ownerId: req.userId });
    return result.isOk() ? reply.status(201).send(result.value) : sendError(reply, result.error);
  });

  app.get("/tracks", async (req, reply) => {
    const query = parse(ListTracksQuery, req.query);
    if (query.isErr()) return sendError(reply, query.error);
    return uc.listTracks.execute(req.userId, query.value.cursor, query.value.limit);
  });

  app.get("/tracks/:trackId", async (req, reply) => {
    const params = parse(TrackParams, req.params);
    if (params.isErr()) return sendError(reply, params.error);
    const result = await uc.getTrack.execute(params.value.trackId, req.userId);
    return result.isOk() ? result.value : sendError(reply, result.error);
  });

  app.delete("/tracks/:trackId", async (req, reply) => {
    const params = parse(TrackParams, req.params);
    if (params.isErr()) return sendError(reply, params.error);
    const result = await uc.deleteTrack.execute(params.value.trackId, req.userId);
    return result.isOk() ? reply.status(204).send() : sendError(reply, result.error);
  });

  app.get("/tracks/:trackId/download.zip", async (req, reply) => {
    const params = parse(TrackParams, req.params);
    if (params.isErr()) return sendError(reply, params.error);
    const result = await uc.downloadStems.execute(params.value.trackId, req.userId);
    if (result.isErr()) return sendError(reply, result.error);

    // FLAC is already compressed: store entries without deflate.
    const zip = new ZipArchive({ store: true });
    zip.on("warning", (error: Error) => req.log.warn({ err: error }, "zip warning"));
    void (async () => {
      try {
        for (const entry of result.value.entries) zip.append(await entry.open(), { name: entry.name });
        await zip.finalize();
      } catch (error) {
        req.log.error({ err: error }, "zip stream failed");
        zip.abort();
      }
    })();
    return reply
      .header("content-type", "application/zip")
      .header("content-disposition", `attachment; filename*=UTF-8''${encodeURIComponent(result.value.filename)}`)
      .send(zip);
  });
}
