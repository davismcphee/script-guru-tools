const defaultClone = (obj) => JSON.parse(JSON.stringify(obj));

export const createUndoRedo = (max = 0, clone = defaultClone) => {
  let currentState = null;
  let undos = [];
  let redos = [];

  return {
    clear() {
      currentState = null;
      undos = [];
      redos = [];
    },
    save(state) {
      if (currentState) {
        undos.push(currentState);

        if (max !== 0 && undos.length > max) {
          undos.splice(0, 1);
        }
      }

      currentState = clone(state);
      redos = [];
    },
    undo() {
      if (!undos.length) {
        return null;
      }

      const state = undos.pop();

      redos.push(currentState);

      currentState = state;

      return clone(state);
    },
    redo() {
      if (!redos.length) {
        return null;
      }

      const state = redos.pop();

      undos.push(currentState);

      currentState = state;

      return clone(state);
    },
  };
};
