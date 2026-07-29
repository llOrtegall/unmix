import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { useLocale } from "./i18n/useT.ts";
import "./styles.css";

document.documentElement.lang = useLocale.getState().locale;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
