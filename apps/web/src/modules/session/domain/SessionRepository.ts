import type { User } from "./User.ts";

export interface SessionRepository {
  findCurrentUser(): Promise<User | null>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
}
