import { faker } from "@faker-js/faker";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageCursor } from "../../domain/PageCursor.ts";
import { TrackId } from "../../domain/TrackId.ts";
import { UploadCandidate } from "../../domain/UploadCandidate.ts";
import { HttpTrackRepository } from "../../infrastructure/HttpTrackRepository.ts";
import * as TrackSummaryMother from "../helpers/TrackSummaryMother.ts";

const BASE = "/api/v1";

const respondWith = (status: number, body?: unknown) =>
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body === undefined ? null : JSON.stringify(body), { status })));

const summaryDto = () => {
  const { id, ...summary } = TrackSummaryMother.createPrimitive();
  return { trackId: id, ...summary };
};

describe("HttpTrackRepository", () => {
  const repository = new HttpTrackRepository(BASE);

  afterEach(() => vi.unstubAllGlobals());

  it("maps a page of tracks and asks for the next one with its cursor", async () => {
    const items = [summaryDto(), summaryDto()];
    respondWith(200, { items, nextCursor: "2026-07-01T10:00:00.000Z" });

    const page = await repository.list(PageCursor.create("2026-07-02T10:00:00.000Z"));

    expect(page.getTracks().map((track) => track.getId().toPrimitive())).toEqual(items.map((item) => item.trackId));
    expect(page.getNextCursor()?.toPrimitive()).toBe("2026-07-01T10:00:00.000Z");
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe(`${BASE}/tracks?limit=30&cursor=2026-07-02T10%3A00%3A00.000Z`);
  });

  it("maps a track with its stems and the archive URL", async () => {
    const dto = summaryDto();
    const stem = {
      name: "bass",
      url: faker.internet.url(),
      previewUrl: faker.internet.url(),
      peaksUrl: faker.internet.url(),
      midiUrl: null,
      sizeBytes: 1024,
      silent: true,
    };
    respondWith(200, { ...dto, latestJobId: faker.string.uuid(), stems: [stem] });

    const track = await repository.findById(TrackId.create(dto.trackId));

    expect(track?.getArchiveUrl().toPrimitive()).toBe(`${BASE}/tracks/${dto.trackId}/download.zip`);
    expect(track?.getStems().toPrimitive()).toEqual([
      { name: "bass", downloadUrl: stem.url, previewUrl: stem.previewUrl, peaksUrl: stem.peaksUrl, midiUrl: null, sizeBytes: 1024, silent: true },
    ]);
  });

  it("finds nothing for an unknown track", async () => {
    respondWith(404, { code: "track.not_found", message: "gone" });

    expect(await repository.findById(TrackId.create(faker.string.uuid()))).toBeNull();
  });

  it("creates an upload with the candidate's media type", async () => {
    const trackId = faker.string.uuid();
    respondWith(201, { trackId, uploadUrl: "https://s3.test/upload", expiresIn: 900 });

    const ticket = await repository.createUpload(UploadCandidate.fromFile({ name: "a.mkv", type: "", size: 10 }));

    expect(ticket.toPrimitive()).toEqual({ trackId, uploadUrl: "https://s3.test/upload" });
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body))).toEqual({ filename: "a.mkv", contentType: "video/x-matroska", sizeBytes: 10 });
  });

  it("deletes a track and requests a separation", async () => {
    const id = TrackId.create(faker.string.uuid());
    respondWith(204);

    await repository.delete(id);
    await repository.requestSeparation(id);

    expect(vi.mocked(fetch).mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
      [`${BASE}/tracks/${id.toPrimitive()}`, "DELETE"],
      [`${BASE}/tracks/${id.toPrimitive()}/jobs`, "POST"],
    ]);
  });

  it("surfaces the API's error code", async () => {
    respondWith(409, { code: "track.busy", message: "busy" });

    await expect(repository.delete(TrackId.create(faker.string.uuid()))).rejects.toMatchObject({ code: "track.busy" });
  });
});
