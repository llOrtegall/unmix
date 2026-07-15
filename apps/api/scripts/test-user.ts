// Test users for browser suites, without Google (ADR 0025).
// sign-in <email> [--demo]   prints {"userId","cookie"} as JSON; --demo also gives the demo song
// delete <domain>            deletes every user whose email ends in @<domain> (rows cascade)
import { parseArgs } from "node:util";
import pg from "pg";
import { AddDemoTrack } from "../src/modules/library/application/use-cases/add-demo-track.ts";
import { DrizzleTrackRepository } from "../src/modules/library/infrastructure/drizzle-track-repository.ts";
import { S3DemoLibrary } from "../src/modules/library/infrastructure/s3-demo-library.ts";
import { S3Storage } from "../src/modules/library/infrastructure/s3-storage.ts";
import { config } from "../src/config.ts";
import { createDatabase, DrizzleTransactions } from "../src/shared/infrastructure/db.ts";
import { systemClock, uuidGenerator } from "../src/shared/infrastructure/system.ts";
import { signInAs } from "./test-session.ts";

const { values, positionals } = parseArgs({ allowPositionals: true, options: { demo: { type: "boolean", default: false } } });
const [command, arg] = positionals;
const client = new pg.Client({ connectionString: config.databaseUrl });
await client.connect();

if (command === "sign-in" && arg) {
  const session = await signInAs(client, arg);
  if (values.demo) {
    const { db, pool } = createDatabase(config.databaseUrl);
    const demo = new S3DemoLibrary(new S3Storage(config.s3));
    const tracks = new DrizzleTrackRepository(new DrizzleTransactions(db));
    if (!(await new AddDemoTrack({ tracks, demo, ids: uuidGenerator, clock: systemClock }).execute(session.userId))) {
      throw new Error("no demo seeded: run pnpm --filter @unmix/api demo:seed");
    }
    await pool.end();
  }
  console.log(JSON.stringify(session));
} else if (command === "delete" && arg) {
  const { rowCount } = await client.query("delete from users where email like $1", [`%@${arg}`]);
  console.log(JSON.stringify({ deleted: rowCount }));
} else {
  throw new Error("usage: test-user.ts sign-in <email> [--demo] | delete <domain>");
}
await client.end();
