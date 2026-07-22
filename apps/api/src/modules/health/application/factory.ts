import type { Queue } from "bullmq";
import type { Database } from "../../shared/infrastructure/database.ts";
import type { S3Settings } from "../../shared/infrastructure/s3Client.ts";
import { BullMqHealthRepository } from "../infrastructure/BullMqHealthRepository.ts";
import { DrizzleHealthRepository } from "../infrastructure/DrizzleHealthRepository.ts";
import { S3HealthRepository } from "../infrastructure/S3HealthRepository.ts";
import { checkHealth } from "./checkHealth.ts";

export const healthModule = (db: Database, queue: Queue, s3: S3Settings) => {
  const databaseHealthRepository = new DrizzleHealthRepository(db);
  const queueHealthRepository = new BullMqHealthRepository(queue);
  const storageHealthRepository = new S3HealthRepository(s3);

  return {
    checkHealth: checkHealth({ databaseHealthRepository, queueHealthRepository, storageHealthRepository }),
  };
};

export type HealthModule = ReturnType<typeof healthModule>;
