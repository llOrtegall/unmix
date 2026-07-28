import { useEffect } from "react";
import { create } from "zustand";
import { session } from "@/modules/session/application/factory.ts";
import type { User } from "@/modules/session/domain/User.ts";
import type { DomainError } from "@/modules/shared/domain/DomainError.ts";
import { SessionExpiredError } from "@/modules/shared/domain/errors/SessionExpiredError.ts";

export type SessionState =
  | { readonly status: "loading" }
  | { readonly status: "signed-out"; readonly error: DomainError | null }
  | { readonly status: "signed-in"; readonly user: User };

interface SessionStore {
  state: SessionState;
  load: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  expire: () => void;
}

const signedOut = (error: DomainError | null = null): SessionState => ({ status: "signed-out", error });

export const useSession = create<SessionStore>()((set) => ({
  state: { status: "loading" },

  async load() {
    try {
      const user = await session.findCurrentUser();
      set({ state: user ? { status: "signed-in", user } : signedOut() });
    } catch (failure) {
      set({ state: signedOut(failure as DomainError) });
    }
  },

  async signIn() {
    try {
      await session.signInWithGoogle();
    } catch (failure) {
      set({ state: signedOut(failure as DomainError) });
    }
  },

  async signOut() {
    try {
      await session.signOut();
      set({ state: signedOut() });
    } catch (failure) {
      set({ state: signedOut(failure as DomainError) });
    }
  },

  expire() {
    set({ state: signedOut(new SessionExpiredError()) });
  },
}));

/** Loads the session once and drops it when the API answers 401. */
export function useSessionLifecycle(): void {
  const load = useSession((store) => store.load);
  const expire = useSession((store) => store.expire);

  useEffect(() => {
    void load();
    return session.watchSessionExpiry(expire);
  }, [load, expire]);
}
