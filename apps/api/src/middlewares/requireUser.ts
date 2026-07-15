import type { FastifyReply, FastifyRequest } from "fastify";
import type { Identity } from "../modules/identity/index.ts";
import { toHeaders } from "../modules/identity/routes.ts";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

export const requireUser = (identity: Identity) => async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = await identity.currentUserId(toHeaders(request));
  if (!userId) return reply.status(401).send({ code: "session.required", message: "Sign in to continue." });
  request.userId = userId;
};
