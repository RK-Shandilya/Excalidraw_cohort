import { Scene } from "../Scene";
import { Point, ExcalidrawElement } from "../types/types";

export class ElementManager {
  private scene: Scene;
  
  constructor(scene: Scene) {
    this.scene = scene;
  }

  findElementAtPoint(point: Point): ExcalidrawElement | null {
    const elements = this.scene.getElements();
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

  normalizeElementDimensions(element: ExcalidrawElement) {
    if (element.width < 0) {
      element.x += element.width;
      element.width = Math.abs(element.width);
    }
    if (element.height < 0) {
      element.y += element.height;
      element.height = Math.abs(element.height);
    }
  }
}