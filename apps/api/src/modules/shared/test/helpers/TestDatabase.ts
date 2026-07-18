import { fileURLToPath } from "node:url";
import { faker } from "@faker-js/faker";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { sql } from "drizzle-orm";
import { createDatabase, type Database, runMigrations } from "../../infrastructure/database.ts";
import { DrizzleTransactionRepository } from "../../infrastructure/DrizzleTransactionRepository.ts";

const MIGRATIONS = fileURLToPath(new URL("../../../../../drizzle", import.meta.url));
const IMAGE = "postgres:17-alpine";

export interface TestDatabase {
  readonly db: Database;
  readonly transactions: DrizzleTransactionRepository;
  createUser(): Promise<string>;
  truncate(): Promise<void>;
  stop(): Promise<void>;
}

export const startTestDatabase = async (): Promise<TestDatabase> => {
  const container = await new PostgreSqlContainer(IMAGE).start();
  const { db, pool } = createDatabase(container.getConnectionUri());
  await runMigrations(db, MIGRATIONS);

  return {
    db,
    transactions: new DrizzleTransactionRepository(db),
    createUser: async () => {
      const id = faker.string.uuid();
      await db.execute(sql`INSERT INTO users (id, name, email) VALUES (${id}, ${faker.person.fullName()}, ${faker.internet.email()})`);
      return id;
    },
    truncate: async () => {
      await db.execute(sql`TRUNCATE outbox, separation_jobs, stems, tracks, users CASCADE`);
    },
    stop: async () => {
      await pool.end();
      await container.stop();
    },
  };
};
