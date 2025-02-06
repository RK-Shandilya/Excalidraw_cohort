import { AppState, ExcalidrawElement, Tool } from '../types/types';
import { Scene } from './SceneManager';
import { SelectionManager } from './SelectionManager';

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
    private scene: Scene, 
    private selectionManager: SelectionManager, 
  ) {
    this.setupListeners();
  }

  private setupListeners() {
    this.scene.addUpdateListener((elements) => {
      this.setSelectedElements(elements);
    });

    this.selectionManager.onSelectionChange((elements) => {
      this.setSelectedElements(elements || []);
    });
  }

  public setTool(tool: Tool) {
    this.state = { ...this.state, currentTool: tool };
    this.notifyUpdateListeners();
  }

  public setSelectedElements(elements: ExcalidrawElement[]) {
    this.state = { ...this.state, selectedElements: elements };
    this.notifyUpdateListeners();
  }

  public setDraggingElement(element: ExcalidrawElement | null) {
    this.state = { ...this.state, draggingElement: element };
    this.notifyUpdateListeners();
  }

  public setPanning(isPanning: boolean) {
    this.state = { ...this.state, isPanning };
    this.notifyUpdateListeners();
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
    this.notifyUpdateListeners();
  }
}