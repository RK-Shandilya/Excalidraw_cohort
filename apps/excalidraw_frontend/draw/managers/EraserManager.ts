import { ExcalidrawElement, Point } from "../types/types";
import { Scene } from "./SceneManager";
import { ElementManager } from "./ElementManager";

export class EraserTool {
  private element: ElementManager;
  private eraserPath: Point[];
  private eraserElement: ExcalidrawElement | null;
  public eraserCursor: HTMLDivElement | null;
  private ERASER_SIZE: number = 20;
  private isErasing: boolean = false;

  constructor(private scene: Scene, eraserPath: Point[], eraserElement: ExcalidrawElement| null, eraserCursor: HTMLDivElement | null, ERASER_SIZE: number) {
    this.eraserPath = eraserPath;
    this.eraserElement = eraserElement;
    this.ERASER_SIZE = ERASER_SIZE;
    this.eraserCursor = eraserCursor;
    this.element = new ElementManager(this.scene, this.ERASER_SIZE);
  }

  public createEraserCursor() {
    if (this.eraserCursor) return; // Ensure the cursor is created only once

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
    style.transform = "translate(-50%, -50%)"; // Center the cursor on the mouse pointer
    document.body.appendChild(this.eraserCursor);
  }

  public startErasing(point: Point): ExcalidrawElement {
    this.isErasing = true;
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

    this.scene.addElement(this.eraserElement);
    return this.eraserElement;
  }


  public updateEraserPath(point: Point) {
    if (!this.isErasing || !this.eraserElement?.points) return;

    const lastPoint = this.eraserPath[this.eraserPath.length - 1];
    if (!lastPoint) return;

    this.eraserPath.push(point);
    this.eraserElement.points.push(point);

    const elements = this.scene.getElements();
    for (const element of elements) {
      if (element.isDeleted || element === this.eraserElement) continue;

      if (element.type === "pencil" && element.points) {
        this.handlePencilErase(element, point);
      } else if (this.element.isPointNearElement(point, element)) {
        element.isDeleted = true;
        this.scene.updateElement(element);
      }
    }
  }

  public showEraserCursor(x: number, y: number) {
    if (!this.eraserCursor) {
      this.createEraserCursor();
    }
    this.eraserCursor!.style.display = "block";
    this.eraserCursor!.style.left = `${x}px`;
    this.eraserCursor!.style.top = `${y}px`;
  }

  public hideEraserCursor() {
    if (this.eraserCursor) {
      this.eraserCursor.style.display = "none";
    }
  }

  private handlePencilErase(element: ExcalidrawElement, eraserPoint: Point): void {
    if (!element.points) return;

    // Check if any point of the pencil stroke intersects with the eraser
    const hasIntersection = element.points.some(point => {
      const distance = Math.hypot(
        point.x - eraserPoint.x,
        point.y - eraserPoint.y
      );
      return distance <= this.ERASER_SIZE / 2;
    });

    // If there's an intersection, delete the entire stroke
    if (hasIntersection) {
      element.isDeleted = true;
      this.scene.updateElement(element);
    }
  }
  public removeEraserPath() {
    if (this.eraserElement) {
      this.eraserElement.isDeleted = true;
      this.scene.updateElement(this.eraserElement);
    }
    this.eraserPath = [];
    this.eraserElement = null;
    this.isErasing = false;
  }
}