import { invoke } from "@tauri-apps/api/core";

const REPOSITORY_URL = "https://github.com/MDerazNasr/Nota";
const LINKEDIN_URL = "https://www.linkedin.com/in/mohamed-deraz-nasr-21825b203/";

export function AboutTab() {
  return (
    <section className="settings-section" aria-label="About nota">
      <div className="about-block">
        <h3>nota</h3>
        <p>Version 0.1.0</p>
        <p>A keyboard-first to-do list for developers. Made for simplicity and productivity.</p>
        <p>Feel free to make any PRs/ suggestions for new features!</p>
        <div className="about-actions">
          <button data-settings-primary type="button" onClick={() => void invoke("open_url", { url: REPOSITORY_URL })}>
            Repository
          </button>
          <button type="button" onClick={() => void invoke("open_url", { url: LINKEDIN_URL })}>
            LinkedIn
          </button>
        </div>
      </div>
    </section>
  );
}
