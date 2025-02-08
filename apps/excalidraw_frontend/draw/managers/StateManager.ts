import { AppState, ExcalidrawElement, Tool } from '../types/types';

// In AppStateManager.ts
export class AppStateManager {
  private state: AppState = {
    currentTool: 'selection',
    selectedElements: [],
    draggingElement: null,
    isPanning: false,
    isResizing: false,
    isRotating: false,
    isDrawing: false,
    startBoundingBox: null,
  };

  private updateListeners: ((state: AppState) => void)[] = [];

  constructor(
  ) {
    
  }

  public setTool(tool: Tool) {
    this.state = { ...this.state, currentTool: tool };
    this.notifyUpdateListeners(); // Notify listeners
  }

  public setDraggingElement(element: ExcalidrawElement | null) {
    this.state = { ...this.state, draggingElement: element };
    this.notifyUpdateListeners(); // Notify listeners
  }

  public setPanning(isPanning: boolean) {
    this.state = { ...this.state, isPanning };
    this.notifyUpdateListeners(); // Notify listeners
  }

  public getState(): AppState {
    return { ...this.state };
  }

  public addUpdateListener(callback: (state: AppState) => void) {
    this.updateListeners.push(callback);
  }

  private notifyUpdateListeners() {
    this.updateListeners.forEach((listener) => listener(this.state));
  }

  public resetState() {
    this.state = {
      currentTool: 'selection',
      selectedElements: [],
      draggingElement: null,
      isPanning: false,
      isResizing: false,
      isRotating: false,
      startBoundingBox: null,
      isDrawing: false,
    };
    this.notifyUpdateListeners(); // Notify listeners
  }

  public setSelectedElements(elements: ExcalidrawElement[]) {
    this.state = { ...this.state, selectedElements: elements };
    this.notifyUpdateListeners();
  }

}