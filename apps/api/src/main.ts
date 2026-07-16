// Composition root (ADR 0015): the only file that knows every module and adapter.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { buildApp } from "./app.ts";
import { createIdentity } from "./modules/identity/auth.ts";
import { libraryModule } from "./modules/library/application/factory.ts";
import { S3StorageRepository } from "./modules/library/infrastructure/S3StorageRepository.ts";
import { GetJob } from "./modules/separation/application/use-cases/get-job.ts";
import { JobLifecycle } from "./modules/separation/application/use-cases/job-lifecycle.ts";
import { ReconcileJobs } from "./modules/separation/application/use-cases/reconcile-jobs.ts";
import { RequestSeparation } from "./modules/separation/application/use-cases/request-separation.ts";
import {
  SEPARATION_COMPLETED,
  SEPARATION_FAILED,
  SEPARATION_REQUESTED,
  type SeparationCompleted,
  type SeparationFailed,
  type SeparationRequested,
} from "./modules/separation/index.ts";
import {
  BullMqQueueInspector,
  createSeparationQueue,
  separationRequestedRoute,
} from "./modules/separation/infrastructure/bullmq.ts";
import { DrizzleJobRepository } from "./modules/separation/infrastructure/drizzle-job-repository.ts";
import { InMemoryJobUpdates } from "./modules/separation/infrastructure/in-memory-job-updates.ts";
import { LibraryTrackCatalog } from "./modules/separation/infrastructure/library-track-catalog.ts";
import { listenToSeparationQueue } from "./modules/separation/infrastructure/bullmq-queue-listener.ts";
import { config } from "./config.ts";
import { createDatabase, runMigrations } from "./modules/shared/infrastructure/database.ts";
import { DrizzleTransactionRepository } from "./modules/shared/infrastructure/DrizzleTransactionRepository.ts";
import { OutboxEventPublisher, OutboxRelay, type OutboxRoute } from "./modules/shared/infrastructure/outbox.ts";
import { systemClock, uuidGenerator } from "./shared/infrastructure/system.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Infrastructure
const { db, pool } = createDatabase(config.databaseUrl);
await runMigrations(db, join(root, "drizzle"));
const tx = new DrizzleTransactionRepository(db);
const events = new OutboxEventPublisher(tx);
const storage = new S3StorageRepository(config.s3);
const queue = createSeparationQueue(config.redisUrl);
const updates = new InMemoryJobUpdates();
const ids = uuidGenerator;
const clock = systemClock;

// Library module
const library = libraryModule(tx, config.s3, config.maxUploadBytes);
events.on<SeparationRequested>(SEPARATION_REQUESTED, async ({ payload }) => {
  await library.startTrackSeparation(payload);
});
events.on<SeparationCompleted>(SEPARATION_COMPLETED, async ({ payload }) => {
  await library.completeTrackSeparation(payload);
});
events.on<SeparationFailed>(SEPARATION_FAILED, async ({ payload }) => {
  await library.failTrackSeparation(payload);
});

// Identity module: new users start with the demo song. Hooks only run during
// requests, so `app` is initialized by then.
const identity = createIdentity(db, config.auth, {
  onUserCreated: async (userId) => {
    await library.addDemoTrack(userId);
  },
  onHookError: (error) => app.log.error({ err: error }, "could not add the demo track"),
});

// Separation module
const jobs = new DrizzleJobRepository(tx);
const catalog = new LibraryTrackCatalog(library);
const lifecycle = new JobLifecycle({ jobs, events, tx, updates, ids, clock });
const inspector = new BullMqQueueInspector(queue);
const separation = {
  requestSeparation: new RequestSeparation({ jobs, catalog, events, tx, updates, ids, clock, model: config.demucsModel }),
  getJob: new GetJob({ jobs, catalog }),
  updates,
};

// HTTP
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

// Background processes
const routes = new Map<string, OutboxRoute>([[SEPARATION_REQUESTED, separationRequestedRoute(queue)]]);
const relay = new OutboxRelay({ tx, routes, log: app.log });
const queueEvents = listenToSeparationQueue({ redisUrl: config.redisUrl, lifecycle, inspector, log: app.log });
await queueEvents.waitUntilReady();
const reconciled = await new ReconcileJobs({ jobs, queue: inspector, lifecycle }).execute();
app.log.info(reconciled, "reconciled unfinished jobs");
relay.start();

const collectGarbage = () =>
  library.collectGarbage().then(
    (result) => app.log.info(result, "garbage collected"),
    (error: unknown) => app.log.error({ err: error }, "garbage collection failed"),
  );
void collectGarbage();
const garbageTimer = setInterval(collectGarbage, 3_600_000);

await app.listen({ port: config.port, host: "0.0.0.0" });

const shutdown = async () => {
  app.log.info("shutting down");
  relay.stop();
  clearInterval(garbageTimer);
  await app.close();
  await queueEvents.close();
  await queue.close();
  await pool.end();
  process.exit(0);
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
