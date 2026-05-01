import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

export function AboutTab() {
  const [version, setVersion] = useState(import.meta.env.TAURI_APP_VERSION ?? "0.1.0");

  useEffect(() => {
    invoke<string>("get_app_version")
      .then(setVersion)
      .catch(() => {
        setVersion(import.meta.env.TAURI_APP_VERSION ?? "0.1.0");
      });
  }, []);

  return (
    <section className="settings-section" aria-label="About nota">
      <div className="about-block">
        <h3>nota</h3>
        <p>Version {version}</p>
        <p>A keyboard-first to-do list for developers.</p>
        <button type="button" onClick={() => void invoke("open_url", { url: "https://github.com/user/nota" })}>
          Repository
        </button>
      </div>
    </section>
  );
}
