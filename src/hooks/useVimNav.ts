import { useNotesStore } from "../store/notes";

export function useVimNav() {
  return useNotesStore((state) => ({
    cursorIndex: state.cursorIndex,
    mode: state.mode,
    moveCursor: state.moveCursor,
    setCursorIndex: state.setCursorIndex,
    setMode: state.setMode,
  }));
}
