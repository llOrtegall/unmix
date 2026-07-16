import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const POOL_SIZE = 10;

export type Database = NodePgDatabase;
export type Executor = Pick<Database, "select" | "insert" | "update" | "delete" | "execute">;

export const createDatabase = (url: string) => {
  const pool = new pg.Pool({ connectionString: url, max: POOL_SIZE });
  return { db: drizzle(pool), pool };
};

export const runMigrations = (db: Database, folder: string): Promise<void> => migrate(db, { migrationsFolder: folder });
