import { useEffect, useRef, type MutableRefObject } from "react";
import { invoke } from "@tauri-apps/api/core";
import { extractFirstLink } from "../lib/content";
import { formatShortcut } from "../lib/shortcuts";
import { useNotesStore } from "../store/notes";
import { useSettingsStore } from "../store/settings";

type KeymapOptions = {
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
};

export function useKeymap({ settingsOpen, setSettingsOpen }: KeymapOptions) {
  const lastDAt = useRef(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const store = useNotesStore.getState();
      const shortcut = formatShortcut(event);
      const shortcuts = useSettingsStore.getState().shortcuts;

      if (handleOverlayShortcut(event, shortcut, setSettingsOpen, settingsOpen)) {
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      if (matchesShortcut(shortcut, shortcuts.checkItem)) {
        handleCheckItem(event);
        return;
      }

      if (store.mode === "move") {
        handleMoveKey(event);
        return;
      }

      if (store.mode !== "nav") {
        return;
      }

      if (event.key === "Escape" && settingsOpen) {
        setSettingsOpen(false);
        return;
      }

      if (hasCommandModifier(event)) {
        handleCommandKey(event, shortcut);
        return;
      }

      if (settingsOpen || store.archiveOpen) {
        return;
      }

      handleNavKey(event, lastDAt);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSettingsOpen, settingsOpen]);
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target.closest("input, textarea, [contenteditable='true']") !== null;
}

function handleOverlayShortcut(
  event: KeyboardEvent,
  shortcut: string,
  setSettingsOpen: (open: boolean) => void,
  settingsOpen: boolean,
) {
  const store = useNotesStore.getState();
  const shortcuts = useSettingsStore.getState().shortcuts;

  if (matchesShortcut(shortcut, shortcuts.toggleArchive)) {
    event.preventDefault();
    setSettingsOpen(false);
    store.setMode("nav");
    store.setArchiveOpen(!store.archiveOpen);
    return true;
  }

  if (matchesShortcut(shortcut, shortcuts.openSettings)) {
    event.preventDefault();
    store.setMode("nav");
    store.setArchiveOpen(false);
    setSettingsOpen(!settingsOpen);
    return true;
  }

  return false;
}

function handleCommandKey(
  event: KeyboardEvent,
  shortcut: string,
) {
  const store = useNotesStore.getState();
  const shortcuts = useSettingsStore.getState().shortcuts;

  if (matchesShortcut(shortcut, shortcuts.newTab)) {
    event.preventDefault();
    store.createTab();
    return;
  }

  if (matchesShortcut(shortcut, shortcuts.openItemLink)) {
    event.preventDefault();
    openFocusedItemLink(store);
    return;
  }

  if (/^[1-9]$/.test(event.key)) {
    event.preventDefault();
    const tab = store.tabs[Number(event.key) - 1];

    if (tab) {
      store.setActiveTab(tab.id);
    }

    return;
  }

  if (matchesShortcut(shortcut, shortcuts.renameTab)) {
    event.preventDefault();
    store.setEditingTabId(store.activeTabId);
  }
}

function openFocusedItemLink(store: ReturnType<typeof useNotesStore.getState>) {
  const tab = store.tabs.find((entry) => entry.id === store.activeTabId);
  const item = tab?.items[store.cursorIndex];
  const href = item ? extractFirstLink(item.content) : null;

  if (href) {
    void invoke("open_url", { url: href });
  }
}

function matchesShortcut(actual: string, expected: string) {
  return expected.length > 0 && actual === expected;
}

function hasCommandModifier(event: KeyboardEvent) {
  return event.metaKey || event.ctrlKey || event.altKey;
}

function handleCheckItem(event: KeyboardEvent) {
  const store = useNotesStore.getState();
  const tab = store.tabs.find((entry) => entry.id === store.activeTabId);
  const item = tab?.items[store.cursorIndex];

  if (tab && item) {
    event.preventDefault();
    store.checkItem(tab.id, item.id);
  }
}

function handleNavKey(event: KeyboardEvent, lastDAt: MutableRefObject<number>) {
  const store = useNotesStore.getState();
  const shortcuts = useSettingsStore.getState().shortcuts;
  const shortcut = formatShortcut(event);

  if (event.key === "j") {
    event.preventDefault();
    store.moveCursor("down");
  } else if (event.key === "k") {
    event.preventDefault();
    store.moveCursor("up");
  } else if (matchesShortcut(shortcut, shortcuts.createItemBelow)) {
    event.preventDefault();
    store.createItem("below");
  } else if (matchesShortcut(shortcut, shortcuts.createItemAbove)) {
    event.preventDefault();
    store.createItem("above");
  } else if (event.key === "h") {
    event.preventDefault();
    switchTab(-1);
  } else if (event.key === "l") {
    event.preventDefault();
    switchTab(1);
  } else if (matchesShortcut(shortcut, shortcuts.moveTabLeft)) {
    event.preventDefault();
    store.reorderTab(store.activeTabId, "left");
  } else if (matchesShortcut(shortcut, shortcuts.moveTabRight)) {
    event.preventDefault();
    store.reorderTab(store.activeTabId, "right");
  } else if (event.key === "d") {
    event.preventDefault();
    deleteOnDoubleD(lastDAt);
  } else if (matchesShortcut(shortcut, shortcuts.deleteItem)) {
    event.preventDefault();
    deleteFocusedItem();
  } else if (matchesShortcut(shortcut, shortcuts.enterMoveMode)) {
    event.preventDefault();
    store.enterMoveMode();
  } else if (matchesShortcut(shortcut, shortcuts.undo)) {
    event.preventDefault();
    store.undoLastChange();
  } else if (matchesShortcut(shortcut, shortcuts.editItem)) {
    event.preventDefault();
    store.setMode("edit");
  }
}

function handleMoveKey(event: KeyboardEvent) {
  const store = useNotesStore.getState();
  const key = event.key.toLowerCase();

  if (event.key === " ") {
    event.preventDefault();
    store.exitMoveMode();
  } else if (event.key === "Escape") {
    event.preventDefault();
    store.exitMoveMode();
  } else if (key === "u") {
    event.preventDefault();
    store.undoLastChange();
  } else if (key === "j" || key === "k") {
    event.preventDefault();
    const direction = key === "j" ? "down" : "up";

    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      store.extendMoveSelection(direction, event.shiftKey);
    } else {
      store.reorderMoveSelection(direction);
    }
  } else if (key === "h" || key === "l") {
    event.preventDefault();
    store.moveSelectionToAdjacentTab(key === "l" ? "right" : "left");
  }
}

function switchTab(offset: number) {
  const store = useNotesStore.getState();
  const currentIndex = store.tabs.findIndex((tab) => tab.id === store.activeTabId);

  if (currentIndex === -1 || store.tabs.length === 0) {
    return;
  }

  const nextIndex = (currentIndex + offset + store.tabs.length) % store.tabs.length;
  store.setActiveTab(store.tabs[nextIndex].id);
}

function deleteOnDoubleD(lastDAt: MutableRefObject<number>) {
  const now = Date.now();

  if (now - lastDAt.current > 500) {
    lastDAt.current = now;
    return;
  }

  deleteFocusedItem();
  lastDAt.current = 0;
}

function deleteFocusedItem() {
  const store = useNotesStore.getState();
  const tab = store.tabs.find((entry) => entry.id === store.activeTabId);
  const item = tab?.items[store.cursorIndex];

  if (tab && item) {
    store.deleteItem(tab.id, item.id);
  }
}
