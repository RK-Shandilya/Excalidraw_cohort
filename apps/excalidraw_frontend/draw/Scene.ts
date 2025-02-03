import { ExcalidrawElement } from "./types/types";

export class Scene {
  private elements: Map<string, ExcalidrawElement> = new Map();
  private listeners: ((elements: ExcalidrawElement[]) => void)[] = [];

  addElement(element: ExcalidrawElement) {
    this.elements.set(element.id, element);
    this.notifyListeners();
  }

  updateElement(element: ExcalidrawElement) {
    this.elements.set(element.id, { ...element });
    this.notifyListeners();
  }

  getElement(id: string): ExcalidrawElement | undefined {
    return this.elements.get(id);
  }

  getElements(): ExcalidrawElement[] {
    return Array.from(this.elements.values());
  }

  deleteElement(id: string) {
    this.elements.delete(id);
  }

  addUpdateListener(callback: (elements: ExcalidrawElement[]) => void) {
    this.listeners.push(callback);
  }

  private notifyListeners() {
    const elements = this.getElements();
    this.listeners.forEach(callback => callback(elements));
  }
}