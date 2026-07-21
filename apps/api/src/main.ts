import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SEPARATION_QUEUE } from "@unmix/contracts";
import { Queue, QueueEvents } from "bullmq";
import { sql } from "drizzle-orm";
import { Redis } from "ioredis";
import { buildApp } from "./app.ts";
import { config } from "./config.ts";
import { libraryEventConsumer } from "./consumers/libraryEventConsumer.ts";
import { separationQueueConsumer } from "./consumers/separationQueueConsumer.ts";
import { collectGarbageJob } from "./jobs/collectGarbageJob.ts";
import { outboxRelayJob } from "./jobs/outboxRelayJob.ts";
import { reconcileJobsJob } from "./jobs/reconcileJobsJob.ts";
import { createIdentity } from "./modules/identity/auth.ts";
import { libraryModule } from "./modules/library/application/factory.ts";
import { S3StorageRepository } from "./modules/library/infrastructure/S3StorageRepository.ts";
import { outboxModule } from "./modules/outbox/application/factory.ts";
import { separationModule } from "./modules/separation/application/factory.ts";
import { createDatabase, runMigrations } from "./modules/shared/infrastructure/database.ts";
import { DrizzleTransactionRepository } from "./modules/shared/infrastructure/DrizzleTransactionRepository.ts";
import { OutboxEventRepository } from "./modules/shared/infrastructure/OutboxEventRepository.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// BullMQ 6 needs its own client per connection; blocking readers need `maxRetriesPerRequest: null`.
const connectRedis = () => new Redis(config.redisUrl, { maxRetriesPerRequest: null });

const { db, pool } = createDatabase(config.databaseUrl);
await runMigrations(db, join(root, "drizzle"));
const transactions = new DrizzleTransactionRepository(db);
const eventRepository = new OutboxEventRepository(transactions);
const storage = new S3StorageRepository(config.s3);
const queue = new Queue(SEPARATION_QUEUE, { connection: connectRedis() });

const library = libraryModule(transactions, config.s3, config.maxUploadBytes);
const separation = separationModule({ transactions, eventRepository, queue, library, model: config.demucsModel });
const outbox = outboxModule(transactions, queue);

// New users start with the demo song. Hooks only run during requests, so `app` is initialized by then.
const identity = createIdentity(db, config.auth, {
  onUserCreated: async (userId) => {
    await library.addDemoTrack(userId);
  },
  onHookError: (error) => app.log.error({ err: error }, "could not add the demo track"),
});

const app = buildApp(
  {
    identity,
    library,
    separation,
    webOrigin: config.webOrigin,
    health: async () => {
      const check = async (fn: () => Promise<unknown>) => fn().then(() => "ok" as const, () => "error" as const);
      return {
        database: await check(() => db.execute(sql`select 1`)),
        redis: await check(() => queue.getJobCounts()),
        storage: await check(() => storage.ping()),
      };
    },
  },
  {
    logger: {
      level: config.logLevel,
      transport: process.stdout.isTTY ? { target: "pino-pretty" } : undefined,
    },
  },
);

libraryEventConsumer(eventRepository, library);
const queueEvents = new QueueEvents(SEPARATION_QUEUE, { connection: connectRedis() });
separationQueueConsumer(queueEvents, separation, app.log);
await queueEvents.waitUntilReady();
await reconcileJobsJob(separation, app.log);
const stopOutboxRelay = outboxRelayJob(outbox, app.log);
const stopGarbageCollection = collectGarbageJob(library, app.log);

await app.listen({ port: config.port, host: "0.0.0.0" });

const shutdown = async () => {
  app.log.info("shutting down");
  stopOutboxRelay();
  stopGarbageCollection();
  await app.close();
  await queueEvents.close();
  await queue.close();
  await pool.end();
  process.exit(0);
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
