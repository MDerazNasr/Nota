export function AboutTab() {
  return (
    <section className="settings-section" aria-label="About nota">
      <div className="about-block" data-settings-row="about" tabIndex={-1}>
        <h3>nota</h3>
        <p>Version 0.1.0</p>
        <p>A keyboard-first to-do list for developers. Made for simplicity and productivity.</p>
        <p>Feel free to make any PRs/ suggestions for new features!</p>
      </div>
    </section>
  );
}
