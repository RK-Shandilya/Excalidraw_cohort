import { ExcalidrawElement, Point } from "../types/types";
import { Camera } from "../Camera";

export class SelectionManager {
  private selectedElements: ExcalidrawElement[] = [];
  private selectionCallback?: (element: ExcalidrawElement | null) => void;

  constructor(private camera: Camera) {}

  public handleSelection(point: Point, elements: ExcalidrawElement[]) {
    const element = this.findElementAtPoint(point, elements);
    
    if (element) {
      this.selectedElements = [element];
      if (this.selectionCallback) {
        this.selectionCallback(element);
      }
    }
    
    return element;
  }

  public clearSelection() {
    const hadSelection = this.selectedElements.length > 0;
    this.selectedElements = [];
    if (hadSelection && this.selectionCallback) {
      this.selectionCallback(null);
    }
    return hadSelection;
  }

  public getSelectedElements() {
    return this.selectedElements;
  }

  public setSelectedElements(elements: ExcalidrawElement[]) {
    this.selectedElements = elements;
  }

  public onSelectionChange(callback: (element: ExcalidrawElement | null) => void) {
    this.selectionCallback = callback;
  }

  private findElementAtPoint(point: Point, elements: ExcalidrawElement[]): ExcalidrawElement | null {
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      if (this.isPointInElement(point, element)) {
        return element;
      }
    }
    return null;
  }

  private isPointInElement(point: Point, element: ExcalidrawElement): boolean {
    return (
      point.x >= element.x &&
      point.x <= element.x + (element.width || 0) &&
      point.y >= element.y &&
      point.y <= element.y + (element.height || 0)
    );
  }

  public renderSelectionBox() {
    // Implement render selection box logic
    return {
      element: {} as ExcalidrawElement,
      screenBounds: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        angle: 0,
      },
    };
  }

  public updateSelectedElements(properties: Partial<ExcalidrawElement>) {
    this.selectedElements.forEach(element => {
      Object.assign(element, properties);
    });
  }
}