import { Route, Switch } from "wouter";
import { AppShell } from "@/components/AppShell.tsx";
import { useSession, useSessionLifecycle } from "@/hooks/useSession.ts";
import { LibraryPage } from "@/pages/LibraryPage.tsx";
import { SignInPage } from "@/pages/SignInPage.tsx";
import { TrackPage } from "@/pages/TrackPage.tsx";

export function App() {
  useSessionLifecycle();
  const state = useSession((store) => store.state);
  return (
    <AppShell>
      {state.status === "signed-in" ? <Routes /> : state.status === "signed-out" ? <SignInPage error={state.error} /> : null}
    </AppShell>
  );
}

function Routes() {
  return (
    <Switch>
      <Route path="/" component={LibraryPage} />
      <Route path="/tracks/:id">{(params) => <TrackPage key={params.id} id={params.id} />}</Route>
      <Route>
        <LibraryPage />
      </Route>
    </Switch>
  );
}
