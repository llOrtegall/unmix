import type { FastifyReply, FastifyRequest } from "fastify";
import type { IdentityModule } from "../modules/identity/application/factory.ts";

const UNAUTHORIZED = 401;

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

export const requireUser = (identity: IdentityModule) => async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = await identity.findSessionUser(request.headers.cookie ?? "");
  if (!userId) return reply.status(UNAUTHORIZED).send({ code: "session.required", message: "Sign in to continue." });
  request.userId = userId.toPrimitive();
};
