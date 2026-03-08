import { useEffect, useRef, type MutableRefObject } from "react";
import { useNotesStore } from "../store/notes";

type KeymapOptions = {
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
};

export function useKeymap({ settingsOpen, setSettingsOpen }: KeymapOptions) {
  const lastDAt = useRef(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const store = useNotesStore.getState();

      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        handleCheckItem(event);
        return;
      }

      if (store.mode !== "nav") {
        return;
      }

      if (event.key === "Escape" && settingsOpen) {
        setSettingsOpen(false);
        return;
      }

      if (event.metaKey || event.ctrlKey) {
        handleCommandKey(event, setSettingsOpen);
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

function handleCommandKey(event: KeyboardEvent, setSettingsOpen: (open: boolean) => void) {
  const store = useNotesStore.getState();

  if (event.key === "t") {
    event.preventDefault();
    store.createTab();
    return;
  }

  if (event.key === "0") {
    event.preventDefault();
    setSettingsOpen(false);
    store.setArchiveOpen(!store.archiveOpen);
    return;
  }

  if (event.key === ",") {
    event.preventDefault();
    store.setArchiveOpen(false);
    setSettingsOpen(true);
    return;
  }

  if (event.key === "Enter") {
    handleCheckItem(event);
  }
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

  if (event.key === "j") {
    event.preventDefault();
    store.moveCursor("down");
  } else if (event.key === "k") {
    event.preventDefault();
    store.moveCursor("up");
  } else if (event.key === "o") {
    event.preventDefault();
    store.createItem("below");
  } else if (event.key === "O") {
    event.preventDefault();
    store.createItem("above");
  } else if (event.key === "h") {
    event.preventDefault();
    switchTab(-1);
  } else if (event.key === "l") {
    event.preventDefault();
    switchTab(1);
  } else if (event.key === "<") {
    event.preventDefault();
    store.reorderTab(store.activeTabId, "left");
  } else if (event.key === ">") {
    event.preventDefault();
    store.reorderTab(store.activeTabId, "right");
  } else if (event.key === "d") {
    event.preventDefault();
    deleteOnDoubleD(lastDAt);
  } else if (event.key === "Enter") {
    event.preventDefault();
    store.setMode("edit");
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
  const store = useNotesStore.getState();

  if (now - lastDAt.current > 500) {
    lastDAt.current = now;
    return;
  }

  const tab = store.tabs.find((entry) => entry.id === store.activeTabId);
  const item = tab?.items[store.cursorIndex];

  if (tab && item) {
    store.deleteItem(tab.id, item.id);
  }

  lastDAt.current = 0;
}
