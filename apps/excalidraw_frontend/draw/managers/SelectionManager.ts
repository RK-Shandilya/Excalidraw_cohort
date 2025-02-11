import { AppState, ExcalidrawElement, Point } from "../types/types";
import { Camera } from "../Camera";
import { Scene } from "./SceneManager";
import { ElementManager } from "./ElementManager";
import { AppStateManager } from "./StateManager";

export class SelectionManager {
  private selectedElements: ExcalidrawElement[] = [];
  private selectionCallback?: (elements: ExcalidrawElement[] | null) => void;
  private elementUpdateCallback?: (elements: ExcalidrawElement[]) => void;

  constructor(private camera: Camera,private scene: Scene,private elementManager: ElementManager,private stateManager: AppStateManager) {
    this.scene = scene;
    this.elementManager = elementManager;
  }

  public handleSelection(point: Point, isShiftPressed: boolean) {
    const element = this.elementManager.findElementAtPoint(point);
    
    if (!element) {
      this.clearSelection();
      return null;
    }

    let newSelection: ExcalidrawElement[];
    if (isShiftPressed) {
      // Toggle selection
      const isSelected = this.selectedElements.some(el => el.id === element.id);
      if (isSelected) {
        newSelection = this.selectedElements.filter(el => el.id !== element.id);
      } else {
        newSelection = [...this.selectedElements, element];
      }
    } else {
      // Single selection
      newSelection = [element];
    }

    this.stateManager.setSelectedElements(newSelection);
    this.notifySelectionChange();
    return element;
  }

  public clearSelection() {
    this.stateManager.setSelectedElements([]); // Clear selection via AppStateManager
    this.notifySelectionChange();
  }

  public getSelectedElements() {
    const selectedElements = this.stateManager.getState().selectedElements;
    console.log("Selected Elements:", selectedElements); // Log selected elements
    return selectedElements;
  }

  public setSelectedElements(elements: ExcalidrawElement[]) {
    this.stateManager.setSelectedElements(elements); // Set selected elements via AppStateManager
    this.notifySelectionChange();
  }

  public onSelectionChange(callback: (elements: ExcalidrawElement[] | null) => void) {
    console.log("inside selection.tsx")
    this.selectionCallback = callback;
  }

  private notifySelectionChange() {
    console.log("inside notifySelection.tsx", this.selectionCallback);
    if (this.selectionCallback) {
      this.selectionCallback(this.getSelectedElements().length > 0 ? this.getSelectedElements() : null);
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

    this.stateManager.setSelectedElements(this.selectedElements);

    this.notifySelectionChange();
  }

  public updateSelectedElements(properties: Partial<ExcalidrawElement>) {
    this.selectedElements.forEach(element => {
      Object.assign(element, properties);
    });
  }
  // In SelectionManager.ts
  public renderSelectionBox() {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0) return null;

    const element = selectedElements[0];
    if (!element) return null;

    // Get camera properties
    const zoom = this.camera.getScale();
    const viewport = this.camera.getViewport();

    // Get bounding box in world coordinates
    const boundingBox = this.elementManager.getBoundingBox(element);
    if (!boundingBox) return null;

    // Transform to screen space
    const screenBounds = {
        x: (boundingBox.x * zoom) + viewport.offset.x,
        y: (boundingBox.y * zoom) + viewport.offset.y,
        width: boundingBox.width * zoom,
        height: boundingBox.height * zoom,
        angle: boundingBox.angle
    };

    return {
        selectedElements,
        screenBounds,
    };
}


  public onElementUpdate(callback: (elements: ExcalidrawElement[]) => void) {
    this.elementUpdateCallback = callback;
  }

  public isPointInSelection(point: Point): boolean {
    const selectedElements = this.getSelectedElements();
    
    for (const element of selectedElements) {
      if (this.elementManager.isPointInElement(this.camera.screenToWorld(point), element)) {
        return true;
      }
    }
    
    return false;
  }
}