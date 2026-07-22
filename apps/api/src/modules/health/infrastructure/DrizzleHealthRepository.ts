import { sql } from "drizzle-orm";
import type { Database } from "../../shared/infrastructure/database.ts";
import type { HealthRepository } from "../domain/HealthRepository.ts";

export class DrizzleHealthRepository implements HealthRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async ping(): Promise<void> {
    await this.db.execute(sql`select 1`);
  }
}
