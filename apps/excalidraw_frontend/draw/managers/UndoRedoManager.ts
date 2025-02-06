import { ExcalidrawElement } from "../types/types";

export class UndoRedoManager {
  private undoStack: ExcalidrawElement[][] = [];
  private redoStack: ExcalidrawElement[][] = [];
  private readonly MAX_STACK_SIZE = 100; // Optional limit to prevent memory bloat

  pushState(elements: ExcalidrawElement[]) {
    if (this.undoStack.length >= this.MAX_STACK_SIZE) {
      this.undoStack.shift(); // Remove the oldest state if limit is exceeded
    }
    this.undoStack.push([...elements]);
    this.redoStack = []; // Clear redo stack on new action
  }

  undo(): ExcalidrawElement[] | null {
    if (this.undoStack.length <= 1) return null; // Prevent clearing the last state
    const previousState = this.undoStack[this.undoStack.length - 2]; // Get last valid state
    const currentState = this.undoStack.pop(); // Remove current state
    if (currentState) this.redoStack.push(currentState);
    return previousState;
  }

  redo(): ExcalidrawElement[] | null {
    if (this.redoStack.length === 0) return null;
    const state = this.redoStack.pop();
    if (state) {
      this.undoStack.push(state);
      return state;
    }
    return null;
  }
}
