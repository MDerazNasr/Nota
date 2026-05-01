export function TabBar() {
  return (
    <nav className="tab-bar" aria-label="Tabs">
      <button className="tab-pill active" type="button">
        Untitled
      </button>
      <button className="tab-add" type="button" aria-label="New tab">
        +
      </button>
    </nav>
  );
}
