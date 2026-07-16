// Test users for browser suites, without Google (ADR 0025).
// sign-in <email> [--demo]   prints {"userId","cookie"} as JSON; --demo also gives the demo song
// delete <domain>            deletes every user whose email ends in @<domain> (rows cascade)
import { parseArgs } from "node:util";
import pg from "pg";
import { config } from "../src/config.ts";
import { libraryModule } from "../src/modules/library/application/factory.ts";
import { createDatabase } from "../src/modules/shared/infrastructure/database.ts";
import { DrizzleTransactionRepository } from "../src/modules/shared/infrastructure/DrizzleTransactionRepository.ts";
import { signInAs } from "./test-session.ts";

const { values, positionals } = parseArgs({ allowPositionals: true, options: { demo: { type: "boolean", default: false } } });
const [command, arg] = positionals;
const client = new pg.Client({ connectionString: config.databaseUrl });
await client.connect();

if (command === "sign-in" && arg) {
  const session = await signInAs(client, arg);
  if (values.demo) {
    const { db, pool } = createDatabase(config.databaseUrl);
    const library = libraryModule(new DrizzleTransactionRepository(db), config.s3, config.maxUploadBytes);
    if (!(await library.addDemoTrack(session.userId))) {
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
