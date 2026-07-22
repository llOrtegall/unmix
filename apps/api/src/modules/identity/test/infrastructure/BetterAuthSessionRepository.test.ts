import { randomBytes } from "node:crypto";
import { faker } from "@faker-js/faker";
import { makeSignature } from "better-auth/crypto";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { DomainEventList } from "../../../shared/domain/DomainEventList.ts";
import * as EventRepositoryMother from "../../../shared/test/helpers/EventRepositoryMother.ts";
import { startTestDatabase, type TestDatabase } from "../../../shared/test/helpers/TestDatabase.ts";
import { SessionCookies } from "../../domain/SessionCookies.ts";
import { UserRegistered } from "../../domain/UserRegistered.ts";
import { BetterAuthSessionRepository } from "../../infrastructure/BetterAuthSessionRepository.ts";
import { type BetterAuth, createBetterAuth } from "../../infrastructure/createBetterAuth.ts";

const SETTINGS = {
  secret: randomBytes(32).toString("hex"),
  baseUrl: "http://localhost:5173",
  google: { clientId: "client-id", clientSecret: "client-secret" },
};
const SESSION_COOKIE = "better-auth.session_token";

describe("BetterAuthSessionRepository", () => {
  let database: TestDatabase;
  let eventRepository: ReturnType<typeof EventRepositoryMother.create>;
  let auth: BetterAuth;
  let repository: BetterAuthSessionRepository;

  const signIn = async (userId: string): Promise<SessionCookies> => {
    const token = randomBytes(24).toString("base64url");
    await database.db.execute(
      sql`INSERT INTO sessions (user_id, token, expires_at) VALUES (${userId}, ${token}, now() + interval '1 hour')`,
    );
    const signature = await makeSignature(token, SETTINGS.secret);
    return SessionCookies.create(`${SESSION_COOKIE}=${encodeURIComponent(`${token}.${signature}`)}`);
  };

  beforeAll(async () => {
    database = await startTestDatabase();
  }, 120_000);

  afterAll(async () => {
    await database.stop();
  });

  beforeEach(async () => {
    await database.truncate();
    eventRepository = EventRepositoryMother.create();
    auth = createBetterAuth(database.db, SETTINGS, eventRepository);
    repository = new BetterAuthSessionRepository(auth);
  });

  describe("Basic behaviour", () => {
    it("finds the user behind a signed session cookie", async () => {
      const userId = await database.createUser();

      const found = await repository.findUserId(await signIn(userId));

      expect(found?.toPrimitive()).toBe(userId);
    });

    it("announces every user Better Auth creates", async () => {
      const context = await auth.$context;

      const user = await context.internalAdapter.createUser(
        { name: faker.person.fullName(), email: faker.internet.email() },
        { method: "oauth" },
      );

      const [events] = eventRepository.publish.mock.calls[0] as [DomainEventList];
      expect(events.toPrimitive()).toEqual([
        expect.objectContaining({ type: UserRegistered.TYPE, payload: { userId: user.id } }),
      ]);
    });

    it("answers auth requests itself", async () => {
      const response = await repository.handle(new Request(`${SETTINGS.baseUrl}/api/auth/get-session`));

      expect(response.status).toBe(200);
      expect(await response.json()).toBeNull();
    });
  });

  describe("Error scenarios", () => {
    it("finds nobody behind a forged cookie", async () => {
      const found = await repository.findUserId(SessionCookies.create(`${SESSION_COOKIE}=forged.signature`));

      expect(found).toBeNull();
    });
  });
});
