import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { container } from "./container.ts";
import { App } from "./presentation/app.tsx";
import { useLocale } from "./presentation/i18n/use-t.ts";
import { ServicesProvider } from "./presentation/services.tsx";
import { SessionProvider } from "./presentation/session.tsx";
import "./presentation/styles.css";

document.documentElement.lang = useLocale.getState().locale;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ServicesProvider services={container}>
      <SessionProvider>
        <App />
      </SessionProvider>
    </ServicesProvider>
  </StrictMode>,
);
