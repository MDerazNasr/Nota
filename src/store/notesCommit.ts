import type { AppState } from "../lib/types";
import { saveNotes } from "./persist";

type NotesHistoryState = AppState & {
  undoStack: AppState[];
};

export function commit<T extends NotesHistoryState>(
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
  get: () => T,
  recipe: (state: T) => Partial<T>,
) {
  const before = toAppState(get());
  set((state) => recipe(state));
  const after = toAppState(get());
  if (hasStateChanged(before, after)) {
    set((state) => ({ undoStack: [...state.undoStack.slice(-19), before] }) as Partial<T>);
  }
  void saveNotes(toAppState(get()));
}

export function toAppState(state: AppState): AppState {
  return {
    tabs: state.tabs,
    activeTabId: state.activeTabId,
  };
}

function hasStateChanged(previous: AppState, next: AppState) {
  return JSON.stringify(previous) !== JSON.stringify(next);
}
