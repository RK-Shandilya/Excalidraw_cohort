import { AppState, ExcalidrawElement, Point } from "../types/types";
import { Camera } from "../Camera";
import { Scene } from "./SceneManager";
import { ElementManager } from "./ElementManager";

export class SelectionManager {
  private selectedElements: ExcalidrawElement[] = [];
  private selectionCallback?: (elements: ExcalidrawElement[] | null) => void;
  private scene: Scene;
  private elementManager: ElementManager;
  private state: AppState;
  private elementUpdateCallback?: (elements: ExcalidrawElement[]) => void;

  constructor(private camera: Camera, scene: Scene, elementManager: ElementManager, state: AppState) {
    this.scene = scene;
    this.elementManager = elementManager;
    this.state = state;
  }

  public handleSelection(point: Point, isShiftPressed: boolean) {
    const element = this.elementManager.findElementAtPoint(point);
    
    if (!element) return null;

    if (isShiftPressed) {
      // Toggle selection if Shift is pressed
      const index = this.selectedElements.indexOf(element);
      if (index !== -1) {
        this.selectedElements.splice(index, 1);
      } else {
        this.selectedElements.push(element);
      }
    } else {
      // Single selection (clears previous selection)
      this.selectedElements = [element];
    }

    this.notifySelectionChange();
    return element;
  }

  public clearSelection() {
    if (this.selectedElements.length === 0) return false;
    this.selectedElements = [];
    this.notifySelectionChange();
    return true;
  }

  public getSelectedElements() {
    return this.selectedElements;
  }

  public setSelectedElements(elements: ExcalidrawElement[]) {
    this.selectedElements = elements;
    this.notifySelectionChange();
  }

  public onSelectionChange(callback: (elements: ExcalidrawElement[] | null) => void) {
    this.selectionCallback = callback;
  }

  private notifySelectionChange() {
    if (this.selectionCallback) {
      this.selectionCallback(this.selectedElements.length > 0 ? this.selectedElements : null);
    }
  }

  public handleSelectionBox(start: Point, end: Point) {
    const xMin = Math.min(start.x, end.x);
    const xMax = Math.max(start.x, end.x);
    const yMin = Math.min(start.y, end.y);
    const yMax = Math.max(start.y, end.y);

    this.selectedElements = this.scene.getElements().filter(element => {
      const { x, y, width = 0, height = 0 } = element;
      return x >= xMin && x + width <= xMax && y >= yMin && y + height <= yMax;
    });

    this.notifySelectionChange();
  }

  public updateSelectedElements(properties: Partial<ExcalidrawElement>) {
    this.selectedElements.forEach(element => {
      Object.assign(element, properties);
    });
  }
  public renderSelectionBox() {
    if (!this.state.selectedElements.length) return null;
    
    const element = this.state.selectedElements[0];
    if (!element) return null;
  
    // Convert world coordinates to screen coordinates
    const screenPos = this.camera.worldToScreen(element.x, element.y);
    const zoom = this.camera.getViewport().zoom; // Use zoom from viewport
    
    return {
      element,
      screenBounds: {
        x: screenPos.x,
        y: screenPos.y,
        width: (element.width || 0) * zoom,
        height: (element.height || 0) * zoom,
        angle: element.angle || 0
      }
    };
  }

  public onElementUpdate(callback: (elements: ExcalidrawElement[]) => void) {
    this.elementUpdateCallback = callback;
  }
}
