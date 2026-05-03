export type ItemEditorVimState = {
  clipboard: string | null;
  commandBuffer: string;
  lastSearch: string | null;
  pendingExCommand: string | null;
  pendingSearch: string | null;
};

const BUFFERABLE_KEYS = new Set(["g", "y", "d", "c"]);
const TEXT_OBJECT_KEYS = new Set(["i", "a"]);

export function recordCommandKey(state: ItemEditorVimState, key: string) {
  if (key.length !== 1 && key !== "Backspace" && key !== "Delete") {
    return null;
  }

  if (!state.commandBuffer && !BUFFERABLE_KEYS.has(key)) {
    return key;
  }

  state.commandBuffer += key;

  if (state.commandBuffer.length === 2 && state.commandBuffer[0] === "c" && !TEXT_OBJECT_KEYS.has(key)) {
    const command = state.commandBuffer;
    state.commandBuffer = "";
    return command;
  }

  if (state.commandBuffer.length >= 3 || state.commandBuffer === "gg" || state.commandBuffer === "yy" || state.commandBuffer === "dd") {
    const command = state.commandBuffer;
    state.commandBuffer = "";
    return command;
  }

  return state.commandBuffer;
}

export function resetVimState(state: ItemEditorVimState) {
  state.commandBuffer = "";
  state.pendingExCommand = null;
  state.pendingSearch = null;
}
