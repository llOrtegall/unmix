import { Route, Switch } from "wouter";
import { AppShell } from "@/presentation/components/app-shell.tsx";
import { LibraryPage } from "@/presentation/pages/library-page.tsx";
import { TrackPage } from "@/presentation/pages/track-page.tsx";

export function App() {
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={LibraryPage} />
        <Route path="/tracks/:id">{(params) => <TrackPage key={params.id} id={params.id} />}</Route>
        <Route>
          <LibraryPage />
        </Route>
      </Switch>
    </AppShell>
  );
}
