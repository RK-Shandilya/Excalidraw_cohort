import { ExcalidrawElement } from "../types/types";

export class Scene {
  private elements: Map<string, ExcalidrawElement> = new Map();
  private listeners: ((elements: ExcalidrawElement[]) => void)[] = [];
  private hasUpdatesFlag = false;

  // Add an element to the scene
  addElement(element: ExcalidrawElement) {
    this.hasUpdatesFlag = true;
    this.elements.set(element.id, element);
    this.notifyListeners();
  }

  // Update an existing element in the scene
  updateElement(element: ExcalidrawElement) {
    this.hasUpdatesFlag = true;
    this.elements.set(element.id, { ...element });
    this.notifyListeners();
  }

  // Get an element by its ID
  getElement(id: string): ExcalidrawElement | undefined {
    return this.elements.get(id);
  }

  // Get all elements in the scene
  getElements(): ExcalidrawElement[] {
    return Array.from(this.elements.values());
  }

  // Delete an element from the scene
  deleteElement(id: string) {
    this.hasUpdatesFlag = true;
    this.elements.delete(id);
    this.notifyListeners();
  }

  // Add a listener that is called when elements change
  addUpdateListener(callback: (elements: ExcalidrawElement[]) => void) {
    this.listeners.push(callback);
  }

  // Check if there are any updates
  public hasUpdates(): boolean {
    return this.hasUpdatesFlag;
  }

  // Clear the update flag
  public clearUpdates() {
    this.hasUpdatesFlag = false;
  }

  // Notify listeners of updates
  private notifyListeners() {
    const elements = this.getElements();
    this.listeners.forEach(callback => callback(elements));
  }

  // Replace all elements in the scene
  replaceElements(elements: ExcalidrawElement[]) {
    this.elements.clear();
    elements.forEach(element => this.elements.set(element.id, element));
    this.notifyListeners();
  }

  // Reset the scene (e.g., clear all elements)
  resetScene() {
    this.elements.clear();
    this.notifyListeners();
  }
}