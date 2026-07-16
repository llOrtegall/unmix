import { AsyncLocalStorage } from "node:async_hooks";
import type { TransactionRepository } from "../domain/TransactionRepository.ts";
import type { Database, Executor } from "./database.ts";

// Repositories ask `executor()` for the current transaction, so use cases never pass a handle around.
export class DrizzleTransactionRepository implements TransactionRepository {
  private readonly db: Database;
  private readonly current = new AsyncLocalStorage<Executor>();

  constructor(db: Database) {
    this.db = db;
  }

  run<T>(work: () => Promise<T>): Promise<T> {
    if (this.current.getStore()) return work();
    return this.db.transaction((transaction) => this.current.run(transaction, work));
  }

  executor(): Executor {
    return this.current.getStore() ?? this.db;
  }
}
