import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@/domain/user.ts";
import { useServices } from "@/presentation/services.tsx";

export type SessionState =
  | { status: "loading" }
  | { status: "signed-out"; error?: string }
  | { status: "signed-in"; user: User };

interface SessionContextValue {
  state: SessionState;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/** Loads the session once and drops it when the API answers 401. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const { session } = useServices();
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void session.current().then((result) => {
      if (!active) return;
      if (!result.ok) setState({ status: "signed-out", error: result.error.code });
      else setState(result.value ? { status: "signed-in", user: result.value } : { status: "signed-out", error: authErrorFromUrl() });
    });
    const unsubscribe = session.onExpired(() => setState({ status: "signed-out", error: "session.required" }));
    return () => {
      active = false;
      unsubscribe();
    };
  }, [session]);

  const signIn = useCallback(async () => {
    const result = await session.signInWithGoogle(location.pathname + location.search.replace(/[?&]error=[^&]*/, ""));
    if (!result.ok) setState({ status: "signed-out", error: result.error.code });
  }, [session]);

  const signOut = useCallback(async () => {
    const result = await session.signOut();
    if (result.ok) setState({ status: "signed-out" });
  }, [session]);

  return <SessionContext.Provider value={{ state, signIn, signOut }}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("SessionProvider missing");
  return value;
}

/** Better Auth sends the browser back with ?error=<code> when Google sign-in fails. */
function authErrorFromUrl(): string | undefined {
  return new URLSearchParams(location.search).get("error") ? "AUTH_FAILED" : undefined;
}
