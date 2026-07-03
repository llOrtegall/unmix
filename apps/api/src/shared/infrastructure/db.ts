import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import type { TransactionManager } from "../kernel/ports.ts";

export type Database = NodePgDatabase;
export type Executor = Pick<Database, "select" | "insert" | "update" | "delete" | "execute">;

export function createDatabase(url: string) {
  const pool = new pg.Pool({ connectionString: url, max: 10 });
  return { db: drizzle(pool), pool };
}

export async function runMigrations(db: Database, folder: string): Promise<void> {
  await migrate(db, { migrationsFolder: folder });
}

/**
 * Transactions via AsyncLocalStorage: repositories ask `executor()` for the
 * current transaction, so use cases never pass a handle around.
 */
export class DrizzleTransactions implements TransactionManager {
  #db: Database;
  #current = new AsyncLocalStorage<Executor>();

  constructor(db: Database) {
    this.#db = db;
  }

  run<T>(work: () => Promise<T>): Promise<T> {
    if (this.#current.getStore()) return work(); // nested: join the outer transaction
    return this.#db.transaction((tx) => this.#current.run(tx, work));
  }

  executor(): Executor {
    return this.#current.getStore() ?? this.#db;
  }
}
