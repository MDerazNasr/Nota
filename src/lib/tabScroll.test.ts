import { describe, expect, it, vi } from "vitest";
import { scrollActiveTabIntoView } from "./tabScroll";

describe("tab scroll", () => {
  it("scrolls the active tab into view without forcing vertical movement", () => {
    const container = document.createElement("nav");
    const inactive = document.createElement("div");
    const active = document.createElement("div");

    inactive.dataset.tabId = "one";
    active.dataset.tabId = "two";
    active.scrollIntoView = vi.fn();

    container.append(inactive, active);

    scrollActiveTabIntoView(container, "two");

    expect(active.scrollIntoView).toHaveBeenCalledWith({
      block: "nearest",
      inline: "nearest",
    });
  });

  it("does nothing when the active tab is missing", () => {
    const container = document.createElement("nav");
    const tab = document.createElement("div");

    tab.dataset.tabId = "one";
    tab.scrollIntoView = vi.fn();
    container.append(tab);

    scrollActiveTabIntoView(container, "two");

    expect(tab.scrollIntoView).not.toHaveBeenCalled();
  });
});
