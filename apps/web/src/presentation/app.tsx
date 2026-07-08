import { Route, Switch } from "wouter";
import { AppShell } from "@/presentation/components/app-shell.tsx";
import { LibraryPage } from "@/presentation/pages/library-page.tsx";
import { SignInPage } from "@/presentation/pages/sign-in-page.tsx";
import { TrackPage } from "@/presentation/pages/track-page.tsx";
import { useSession } from "@/presentation/session.tsx";

export function App() {
  const { state } = useSession();
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
