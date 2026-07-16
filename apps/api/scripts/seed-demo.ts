// Seeds the demo song (ADR 0026): separates it once through the running stack,
// keeps its files under demo/ and gives every user who lacks it a ready copy.
// Usage: node --env-file=../../.env scripts/seed-demo.ts <file> --title <t> --credit <c> [--force]
// --force separates again and replaces every user's demo copy (e.g. after the worker gains MIDI).
import { readFile, stat } from "node:fs/promises";
import { basename, extname } from "node:path";
import { parseArgs } from "node:util";
import { CopyObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { CreateUploadResponse, JobResponse } from "@unmix/contracts";
import pg from "pg";
import { config } from "../src/config.ts";
import { libraryModule } from "../src/modules/library/application/factory.ts";
import { DemoSong } from "../src/modules/library/domain/DemoSong.ts";
import { TrackId } from "../src/modules/library/domain/TrackId.ts";
import { DrizzleTrackRepository } from "../src/modules/library/infrastructure/DrizzleTrackRepository.ts";
import { DEMO_MANIFEST_KEY } from "../src/modules/library/infrastructure/S3DemoSongRepository.ts";
import { S3StorageRepository } from "../src/modules/library/infrastructure/S3StorageRepository.ts";
import { createDatabase } from "../src/modules/shared/infrastructure/database.ts";
import { DrizzleTransactionRepository } from "../src/modules/shared/infrastructure/DrizzleTransactionRepository.ts";
import { signInAs } from "./test-session.ts";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { title: { type: "string" }, credit: { type: "string" }, force: { type: "boolean", default: false } },
});
const file = positionals[0];
if (!file || !values.title || !values.credit) throw new Error("usage: seed-demo.ts <file> --title <t> --credit <c> [--force]");

const API = process.env.E2E_API_URL ?? `http://localhost:${config.port}/api/v1`;
const TYPES: Record<string, string> = { ".mp3": "audio/mpeg", ".wav": "audio/wav", ".flac": "audio/flac" };
const storage = new S3StorageRepository(config.s3);
const { db, pool } = createDatabase(config.databaseUrl);
const transactions = new DrizzleTransactionRepository(db);
const tracks = new DrizzleTrackRepository(transactions);

if (values.force || !(await storage.exists(DEMO_MANIFEST_KEY))) {
  await separateDemo(file, values.title, values.credit);
  // Existing copies point at the old stems list: replace them with the new one below.
  const { rowCount } = await pool.query(`delete from tracks where input_key like 'demo/%'`);
  console.log(`replaced ${rowCount} existing demo track(s)`);
} else {
  console.log("demo already seeded (use --force to redo it)");
}

// Backfill: users created before the demo existed (or whose copy was just replaced).
const library = libraryModule(transactions, config.s3, config.maxUploadBytes);
const { rows: missing } = await pool.query<{ id: string }>(
  `select id from users u where not exists (select 1 from tracks t where t.user_id = u.id and t.input_key like 'demo/%')`,
);
for (const { id } of missing) await library.addDemoTrack(id);
console.log(`demo added to ${missing.length} existing user(s)`);
await pool.end();

async function separateDemo(path: string, title: string, credit: string) {
  const client = new pg.Client({ connectionString: config.databaseUrl });
  await client.connect();
  const { userId, cookie } = await signInAs(client, "demo-seed@unmix.local");
  const call = async (route: string, init: RequestInit = {}) => {
    const res = await fetch(`${API}${route}`, { ...init, headers: { ...init.headers, cookie } });
    if (!res.ok && res.status !== 204) throw new Error(`${init.method ?? "GET"} ${route} -> ${res.status} ${await res.text()}`);
    return res;
  };

  const contentType = TYPES[extname(path)] ?? "application/octet-stream";
  const { size } = await stat(path);
  const upload = CreateUploadResponse.parse(
    await (
      await call("/uploads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: basename(path), contentType, sizeBytes: size }),
      })
    ).json(),
  );
  const put = await fetch(upload.uploadUrl, { method: "PUT", headers: { "content-type": contentType }, body: await readFile(path) });
  if (!put.ok) throw new Error(`upload failed: ${put.status}`);

  let job = JobResponse.parse(await (await call(`/tracks/${upload.trackId}/jobs`, { method: "POST" })).json());
  console.log(`separating ${basename(path)} (job ${job.jobId})…`);
  while (job.status !== "completed") {
    if (job.status === "failed") throw new Error(`separation failed: ${JSON.stringify(job.error)}`);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    job = JobResponse.parse(await (await call(`/jobs/${job.jobId}`)).json());
  }

  // Copy the files out of the throwaway track, keeping their names.
  const track = await tracks.findById(TrackId.fromPrimitive(upload.trackId));
  if (!track) throw new Error("seed track vanished");
  const t = track.toPrimitive();
  const from = `tracks/${t.id}/`;
  const toDemo = (key: string) => `demo/${key.slice(from.length)}`;
  const s3 = new S3Client({
    region: config.s3.region,
    endpoint: config.s3.endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId: config.s3.accessKey, secretAccessKey: config.s3.secretKey },
  });
  const keys = [t.inputKey, ...t.stems.flatMap((s) => [s.key, s.previewKey, s.peaksKey, ...(s.midiKey ? [s.midiKey] : [])])];
  for (const key of keys) {
    await s3.send(new CopyObjectCommand({ Bucket: config.s3.bucket, CopySource: `${config.s3.bucket}/${key}`, Key: toDemo(key) }));
  }

  const demo = DemoSong.fromPrimitive({
    title,
    originalFilename: t.originalFilename,
    contentType: t.mediaType,
    sizeBytes: t.sizeBytes,
    inputKey: toDemo(t.inputKey),
    durationSeconds: t.durationSeconds!,
    credit,
    stems: t.stems.map((s) => ({
      name: s.name,
      key: toDemo(s.key),
      sizeBytes: s.sizeBytes,
      silent: s.silent,
      previewKey: toDemo(s.previewKey),
      peaksKey: toDemo(s.peaksKey),
      midiKey: s.midiKey ? toDemo(s.midiKey) : null,
    })),
  }).toPrimitive();
  await s3.send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: DEMO_MANIFEST_KEY.toPrimitive(),
      Body: JSON.stringify(demo, null, 2),
      ContentType: "application/json",
    }),
  );
  console.log(`demo saved: ${demo.stems.map((s) => `${s.name}${s.silent ? "(silent)" : ""}`).join(", ")}`);

  await call(`/tracks/${t.id}`, { method: "DELETE" });
  await client.query("delete from users where id = $1", [userId]);
  await client.end();
}
