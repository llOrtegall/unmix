import { HealthReport } from "../domain/HealthReport.ts";
import type { HealthRepository } from "../domain/HealthRepository.ts";
import { ServiceStatus } from "../domain/ServiceStatus.ts";

interface Dependencies {
  readonly databaseHealthRepository: HealthRepository;
  readonly queueHealthRepository: HealthRepository;
  readonly storageHealthRepository: HealthRepository;
}

// A failed ping is a degraded service to report, not a failure of the health check itself.
const statusOf = (repository: HealthRepository): Promise<ServiceStatus> =>
  repository.ping().then(
    () => ServiceStatus.ok(),
    () => ServiceStatus.error(),
  );

export const checkHealth =
  ({ databaseHealthRepository, queueHealthRepository, storageHealthRepository }: Dependencies) =>
  async (): Promise<HealthReport> => {
    const [database, queue, storage] = await Promise.all([
      statusOf(databaseHealthRepository),
      statusOf(queueHealthRepository),
      statusOf(storageHealthRepository),
    ]);
    return HealthReport.create({ database, queue, storage });
  };
