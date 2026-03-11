import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { useNotesStore } from "./store/notes";
import { useSettingsStore } from "./store/settings";
import "./styles.css";
import "./styles/settings.css";

async function bootstrap() {
  await useSettingsStore.getState().hydrateSettings();
  await useNotesStore.getState().hydrateNotes();

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();
