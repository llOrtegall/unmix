export interface TransactionRepository {
  run<T>(work: () => Promise<T>): Promise<T>;
}
