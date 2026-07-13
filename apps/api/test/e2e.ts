// End-to-end check against a running stack (API + worker + infra).
// Usage: node --env-file=../../.env test/e2e.ts <audio file> [--keep]
// Signs in two test users by writing Better Auth sessions straight to Postgres.
import { readFile, stat } from "node:fs/promises";
import { basename, extname } from "node:path";
import { CreateUploadResponse, JobResponse, ListTracksResponse, TrackDetail } from "@unmix/contracts";
import pg from "pg";
import { signInAs } from "../scripts/test-session.ts";

const API = process.env.E2E_API_URL ?? `http://localhost:${process.env.API_PORT ?? 3000}/api/v1`;
const TYPES: Record<string, string> = { ".mp3": "audio/mpeg", ".wav": "audio/wav", ".flac": "audio/flac", ".mp4": "video/mp4" };

const file = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
if (!file) throw new Error("usage: e2e.ts <audio file> [--keep]");
const keep = process.argv.includes("--keep");
const started = Date.now();
const log = (msg: string) => console.log(`[${((Date.now() - started) / 1000).toFixed(1).padStart(6)}s] ${msg}`);

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const { cookie: owner } = await signInAs(db, "e2e-owner@unmix.test");
const { cookie: stranger } = await signInAs(db, "e2e-stranger@unmix.test");
const as = (cookie: string, init: RequestInit = {}): RequestInit => ({ ...init, headers: { ...init.headers, cookie } });

async function call(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, as(owner, init));
  if (!res.ok && res.status !== 204) throw new Error(`${init?.method ?? "GET"} ${path} -> ${res.status} ${await res.text()}`);
  return res;
}

// 1. Auth is required; validation errors are mapped to HTTP codes.
const anonymous = await fetch(`${API}/tracks`);
log(`no session -> ${anonymous.status}`);
if (anonymous.status !== 401) throw new Error("expected 401 without a session");

const bad = await fetch(
  `${API}/uploads`,
  as(owner, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ filename: "x.exe", contentType: "application/x-msdownload", sizeBytes: 10 }),
  }),
);
log(`unsupported type -> ${bad.status} ${JSON.stringify(await bad.json())}`);

// 2. Register upload and PUT the file straight to storage.
const contentType = TYPES[extname(file)] ?? "application/octet-stream";
const { size } = await stat(file);
const upload = CreateUploadResponse.parse(
  await (
    await call("/uploads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filename: basename(file), contentType, sizeBytes: size }),
    })
  ).json(),
);
log(`track ${upload.trackId} registered`);

const early = await fetch(`${API}/tracks/${upload.trackId}/jobs`, as(owner, { method: "POST" }));
log(`separation before upload -> ${early.status}`);

const put = await fetch(upload.uploadUrl, { method: "PUT", headers: { "content-type": contentType }, body: await readFile(file) });
if (!put.ok) throw new Error(`upload failed: ${put.status} ${await put.text()}`);
log(`uploaded ${(size / 1_048_576).toFixed(1)} MB`);

// 3. Request separation and follow it over SSE.
const job = JobResponse.parse(await (await call(`/tracks/${upload.trackId}/jobs`, { method: "POST" })).json());
log(`job ${job.jobId} ${job.status}`);
const twice = await fetch(`${API}/tracks/${upload.trackId}/jobs`, as(owner, { method: "POST" }));
log(`second request while separating -> ${twice.status}`);

const sse = await call(`/jobs/${job.jobId}/events`);
const reader = sse.body!.pipeThrough(new TextDecoderStream()).getReader();
let buffer = "";
let final: JobResponse | null = null;
let lastShown = -10;
while (!final) {
  const { value, done } = await reader.read();
  if (done) break;
  buffer += value;
  for (let i = buffer.indexOf("\n\n"); i >= 0; i = buffer.indexOf("\n\n")) {
    const chunk = buffer.slice(0, i);
    buffer = buffer.slice(i + 2);
    const event = /^event: (.+)$/m.exec(chunk)?.[1];
    const data = /^data: (.+)$/m.exec(chunk)?.[1];
    if (!event || !data) continue;
    const update = JobResponse.parse(JSON.parse(data));
    if (event === "completed" || event === "failed") final = update;
    if (final || event === "snapshot" || update.progress - lastShown >= 10) {
      log(`sse ${event}: ${update.status} ${update.stage ?? "-"} ${update.progress}%`);
      lastShown = update.progress;
    }
  }
}
if (final?.status !== "completed") throw new Error(`job did not complete: ${JSON.stringify(final)}`);

// 4. Track detail, stem download URL, ZIP and history.
const track = TrackDetail.parse(await (await call(`/tracks/${upload.trackId}`)).json());
log(`track ${track.status}, ${track.durationSeconds?.toFixed(1)} s, stems: ${track.stems.map((s) => `${s.name}${s.silent ? "(silent)" : ""}`).join(", ")}`);
const stem = await fetch(track.stems[0]!.url);
log(`stem url -> ${stem.status} ${stem.headers.get("content-length")} bytes`);
await stem.body?.cancel();
const peaks = (await (await fetch(track.stems[0]!.peaksUrl)).json()) as { peaks: number[] };
const preview = await fetch(track.stems[0]!.previewUrl);
log(`peaks -> ${peaks.peaks.length} points, preview -> ${preview.status} ${preview.headers.get("content-type")} ${preview.headers.get("content-length")} bytes`);
await preview.body?.cancel();
const transcribed = track.stems.filter((s) => s.midiUrl);
const midi = new Uint8Array(await (await fetch(transcribed[0]!.midiUrl!)).arrayBuffer());
log(`midi for ${transcribed.map((s) => s.name).join(", ")} -> ${new TextDecoder().decode(midi.slice(0, 4))} ${midi.byteLength} bytes`);
if (transcribed.some((s) => s.name === "drums") || new TextDecoder().decode(midi.slice(0, 4)) !== "MThd") {
  throw new Error("expected Standard MIDI files for pitched stems only");
}

const zip = await call(`/tracks/${upload.trackId}/download.zip`);
const zipBytes = (await zip.arrayBuffer()).byteLength;
log(`zip -> ${zip.headers.get("content-type")} ${(zipBytes / 1_048_576).toFixed(1)} MB`);

const list = ListTracksResponse.parse(await (await call("/tracks?limit=5")).json());
log(`history: ${list.items.length} tracks, newest ${list.items[0]?.title}`);

// 5. Another user sees none of it.
const theirs = ListTracksResponse.parse(await (await fetch(`${API}/tracks`, as(stranger))).json());
const peeks = await Promise.all(
  [`/tracks/${upload.trackId}`, `/jobs/${job.jobId}`, `/jobs/${job.jobId}/events`, `/tracks/${upload.trackId}/download.zip`].map(
    async (path) => (await fetch(`${API}${path}`, as(stranger))).status,
  ),
);
const steal = await fetch(`${API}/tracks/${upload.trackId}`, as(stranger, { method: "DELETE" }));
log(`stranger: ${theirs.items.length} tracks, reads -> ${peeks.join(" ")}, delete -> ${steal.status}`);
if (theirs.items.some((t) => t.trackId === upload.trackId) || [...peeks, steal.status].some((s) => s !== 404)) {
  throw new Error("another user can reach this track");
}

if (!keep) {
  await call(`/tracks/${upload.trackId}`, { method: "DELETE" });
  const gone = await fetch(`${API}/tracks/${upload.trackId}`, as(owner));
  log(`deleted -> GET ${gone.status}`);
  await db.query(`delete from users where email like '%@unmix.test'`);
}
await db.end();
log("e2e OK");
