import type { FastifyBaseLogger } from "fastify";
import type { SeparationModule } from "../modules/separation/application/factory.ts";

export const reconcileJobsJob = async (separation: SeparationModule, log: FastifyBaseLogger): Promise<void> => {
  const report = await separation.reconcileJobs();
  log.info(report, "reconciled unfinished jobs");
};
