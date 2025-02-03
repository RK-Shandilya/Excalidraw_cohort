import { ExcalidrawElement, Point } from "../types/types";
import { Scene } from "../Scene";
import {Element} from './Element'

export class EraserTool {
  private eraserPath: Point[] = [];
  private eraserElement: ExcalidrawElement | null = null;
  private eraserCursor: HTMLDivElement | null = null;
  private readonly ERASER_SIZE = 20;
  private element: Element;

  constructor(private scene: Scene) {
    this.createEraserCursor();
    this.element = new Element(this.ERASER_SIZE);
  }

  private createEraserCursor() {
    this.eraserCursor = document.createElement("div");
    const style = this.eraserCursor.style;
    style.position = "fixed";
    style.width = `${this.ERASER_SIZE}px`;
    style.height = `${this.ERASER_SIZE}px`;
    style.border = "1.5px solid #666";
    style.borderRadius = "50%";
    style.pointerEvents = "none";
    style.display = "none";
    style.zIndex = "1000";
    document.body.appendChild(this.eraserCursor);
  }

  public startErasing(point: Point): ExcalidrawElement {
    this.eraserPath = [point];

    this.eraserElement = {
      id: crypto.randomUUID(),
      type: "pencil",
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      angle: 0,
      strokeColor: "rgba(144, 144, 144, 0.1)",
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: this.ERASER_SIZE,
      roughness: 0,
      opacity: 0.3,
      points: [point],
      isEraser: true,
    };

    return this.eraserElement;
  }

  public updateEraserPath(point: Point, elements: ExcalidrawElement[]): ExcalidrawElement[] {
    if (!this.eraserElement?.points) return [];

    const lastPoint = this.eraserPath[this.eraserPath.length - 1];
    if (!lastPoint) return [];

    this.eraserPath.push(point);
    this.eraserElement.points.push(point);

    const updatedElements: ExcalidrawElement[] = [];
    
    for (const element of elements) {
      if (element.isDeleted || element === this.eraserElement) continue;

      if (element.type === "pencil" && element.points) {
        const result = this.handlePencilErase(element, point);
        if (result && result.length > 0) {
          updatedElements.push(...result);
        }
      } else if (this.element.isPointNearElement(point, element)) {
        element.isDeleted = true;
        updatedElements.push(element);
      }
    }

    return updatedElements;
  }


  public showEraserCursor(x: number, y: number) {
    if (!this.eraserCursor) return;
    this.eraserCursor.style.display = "block";
    this.eraserCursor.style.left = `${x - this.ERASER_SIZE / 2}px`;
    this.eraserCursor.style.top = `${y - this.ERASER_SIZE / 2}px`;
  }

  public hideEraserCursor() {
    if (this.eraserCursor) {
      this.eraserCursor.style.display = "none";
    }
  }

  private handlePencilErase(element: ExcalidrawElement, eraserPoint: Point): any {
    if (!element.points) return;

    // Create new segments that don't intersect with the eraser
    let newSegments: Point[][] = [];
    let currentSegment: Point[] = [];

    for (const point of element.points) {
      const distance = Math.hypot(
        point.x - eraserPoint.x,
        point.y - eraserPoint.y
      );

      if (distance > this.ERASER_SIZE / 2) {
        currentSegment.push(point);
      } else {
        if (currentSegment.length > 1) {
          newSegments.push([...currentSegment]);
        }
        currentSegment = [];
      }
    }

    if (currentSegment.length > 1) {
      newSegments.push(currentSegment);
    }

    // Create new elements for each segment
    if (newSegments.length > 0) {
      element.isDeleted = true;
      this.scene.updateElement(element);

      for (const segment of newSegments) {
        const newElement: ExcalidrawElement = {
          ...element,
          id: crypto.randomUUID(),
          points: segment,
          isDeleted: false,
        };
        this.scene.addElement(newElement);
      }
    } else if (newSegments.length === 0) {
      // If no segments remain, delete the entire element
      element.isDeleted = true;
      this.scene.updateElement(element);
    }
  }
}