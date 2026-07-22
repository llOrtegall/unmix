import type { FastifyPluginAsync } from "fastify";
import type { HealthModule } from "../modules/health/application/factory.ts";

const OK = 200;
const SERVICE_UNAVAILABLE = 503;

export const healthRoutes =
  (health: HealthModule): FastifyPluginAsync =>
  async (app) => {
    app.get("/health", async (_request, reply) => {
      const report = await health.checkHealth();
      const { database, queue, storage } = report.toPrimitive();
      return reply
        .status(report.isHealthy() ? OK : SERVICE_UNAVAILABLE)
        .send({ status: report.isHealthy() ? "ok" : "degraded", checks: { database, redis: queue, storage } });
    });
  };
