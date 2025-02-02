import { ExcalidrawElement } from "./types";

export class UndoRedoManager {
  private undoStack: ExcalidrawElement[][] = [];
  private redoStack: ExcalidrawElement[][] = [];

  pushState(elements: ExcalidrawElement[]) {
    this.undoStack.push([...elements]);
    this.redoStack = []; // Clear redo stack on new action
  }

  undo(): ExcalidrawElement[] | null {
    if (this.undoStack.length === 0) return null;
    const state = this.undoStack.pop();
    if (state) this.redoStack.push(state);
    return this.undoStack[this.undoStack.length - 1] || [];
  }

  redo(): ExcalidrawElement[] | null {
    if (this.redoStack.length === 0) return null;
    const state = this.redoStack.pop();
    if (state) this.undoStack.push(state);
    return state || null;
  }
}