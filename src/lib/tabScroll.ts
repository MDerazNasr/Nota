export function scrollActiveTabIntoView(container: HTMLElement | null, activeTabId: string) {
  if (!container) {
    return;
  }

  const activeTab = Array.from(container.querySelectorAll<HTMLElement>("[data-tab-id]")).find(
    (element) => element.dataset.tabId === activeTabId,
  );

  activeTab?.scrollIntoView({
    block: "nearest",
    inline: "nearest",
  });
}
