import cors from "@fastify/cors";
import Fastify, { type FastifyServerOptions } from "fastify";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.ts";
import { requireUser } from "./middlewares/requireUser.ts";
import type { HealthModule } from "./modules/health/application/factory.ts";
import type { IdentityModule } from "./modules/identity/application/factory.ts";
import type { LibraryModule } from "./modules/library/application/factory.ts";
import type { SeparationModule } from "./modules/separation/application/factory.ts";
import { healthRoutes } from "./routes/healthRoutes.ts";
import { identityRoutes } from "./routes/identityRoutes.ts";
import { libraryRoutes } from "./routes/libraryRoutes.ts";
import { separationRoutes } from "./routes/separationRoutes.ts";

export interface AppModules {
  readonly health: HealthModule;
  readonly identity: IdentityModule;
  readonly library: LibraryModule;
  readonly separation: SeparationModule;
}

export const buildApp = (modules: AppModules, webOrigin: string, options: FastifyServerOptions = {}) => {
  const app = Fastify(options);
  app.register(cors, { origin: webOrigin, methods: ["GET", "POST", "DELETE"] });
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  app.register(healthRoutes(modules.health));
  app.register(identityRoutes(modules.identity));
  app.register(
    async (api) => {
      api.addHook("preHandler", requireUser(modules.identity));
      await api.register(libraryRoutes(modules.library));
      await api.register(separationRoutes(modules.separation));
    },
    { prefix: "/api/v1" },
  );
  return app;
};
