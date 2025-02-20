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

    const updatedElement = this.getSelectedElements().find(el => el.id === element.id);
    if (updatedElement) {
      this.scene.updateElement(updatedElement);
      this.renderSelectionBox(updatedElement);
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

    this.setSelectedElements(newSelection);
    this.notifySelectionChange();
    return element;
  }

  public clearSelection() {
    this.setSelectedElements([]); // Clear selection via AppStateManager
    this.notifySelectionChange();
  }

  public getSelectedElements() {
    const selectedElements = this.stateManager.getState().selectedElements;
    return selectedElements;
  }

  public setSelectedElements(elements: ExcalidrawElement[]) {
    this.stateManager.setSelectedElements(elements); // Set selected elements via AppStateManager
    this.notifySelectionChange();
  }

  public onSelectionChange(callback: (elements: ExcalidrawElement[] | null) => void) {
    this.selectionCallback = callback;
  }

  private notifySelectionChange() {
    if (this.selectionCallback) {
      this.selectionCallback(this.getSelectedElements().length > 0 ? this.getSelectedElements() : null);
    }
  }

  // In SelectionManager.ts
  public renderSelectionBox(updatedElement: ExcalidrawElement) {
    if(!updatedElement) return;
    const selectedElements = this.getSelectedElements();

    if(selectedElements.length == 0) {
      return null;
    }

    // Get element's bounding box in world coordinates
    const boundingBox = this.elementManager.getBoundingBox(updatedElement);
    if (!boundingBox) return null;

    // Get the element's center in world coordinates
    const centerWorld = {
      x: boundingBox.x + boundingBox.width / 2,
      y: boundingBox.y + boundingBox.height / 2
    };

    // Convert center to screen coordinates
    const centerScreen = this.camera.worldToScreen(centerWorld);
    
    // Calculate screen bounds with proper scaling and rotation
    const scale = this.camera.getScale();

    // Convert world coordinates to screen coordinates
    
    const screenBounds = {
      x: centerScreen.x - (boundingBox.width * scale) / 2,
      y: centerScreen.y - (boundingBox.height * scale) / 2,
      width: boundingBox.width * scale,
      height: boundingBox.height * scale,
      angle: updatedElement.angle || 0
    };

    return {
      selectedElements,
      screenBounds,
    };
  }


  public onElementUpdate(callback: (elements: ExcalidrawElement[]) => void) {
    this.elementUpdateCallback = callback;
  }
}