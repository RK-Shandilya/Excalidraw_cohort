import { Scene } from "./SceneManager";
import { Point, ExcalidrawElement } from "../types/types";

export class ElementManager {
  private scene: Scene;
  private ERASER_SIZE: number;

  constructor(scene: Scene, ERASER_SIZE: number) {
    this.scene = scene;
    this.ERASER_SIZE = ERASER_SIZE;
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

  public getDistance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  getBoundingBox(element: ExcalidrawElement) {
    const { x, y, width = 0, height = 0, angle = 0 } = element;
  
    // Return the element's boundary directly
    return {
      x,
      y,
      width,
      height,
      angle,
    };
  }

  isPointNearElement(point: Point, element: ExcalidrawElement): boolean {
    const tolerance = this.ERASER_SIZE / 2;
    switch (element.type) {
      case "rect":
        return this.isPointNearRectangle(point, element, tolerance);
      case "circle":
        return this.isPointNearEllipse(point, element, tolerance);
      case "line":
      case "arrow":
        return this.isPointNearLine(point, element, tolerance);
      case "text":
        return this.isPointInRectangle(point, element);
      default:
        return false;
    }
  }

  isPointInElement(point: Point, element: ExcalidrawElement): boolean {
    switch (element.type) {
      case "rect":
        return this.isPointInRectangle(point, element);
      case "circle":
        return this.isPointNearEllipse(point, element, 0);
      case "line":
      case "arrow":
        return this.isPointNearLine(point, element, 0);
      case "text":
        return this.isPointInRectangle(point, element);
      default:
        return false;
    }
  }

  isPointNearRectangle(point: Point, element: ExcalidrawElement, tolerance: number): boolean {
    const { x, y, width, height } = this.getBoundingBox(element);
    return (
      point.x >= x - tolerance &&
      point.x <= x + width + tolerance &&
      point.y >= y - tolerance &&
      point.y <= y + height + tolerance &&
      (point.x <= x + tolerance || point.x >= x + width - tolerance ||
        point.y <= y + tolerance || point.y >= y + height - tolerance)
    );
  }

  isPointNearEllipse(point: Point, element: ExcalidrawElement, tolerance: number): boolean {
    const { x, y, width, height } = this.getBoundingBox(element);
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radiusX = width / 2;
    const radiusY = height / 2;
    const normalizedX = (point.x - centerX) / (radiusX + tolerance);
    const normalizedY = (point.y - centerY) / (radiusY + tolerance);
    return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
  }

  isPointNearLine(point: Point, element: ExcalidrawElement, tolerance: number): boolean {
    const start = { x: element.x, y: element.y };
    const end = { x: element.x + (element.width || 0), y: element.y + (element.height || 0) };
    if (
      point.x < Math.min(start.x, end.x) - tolerance ||
      point.x > Math.max(start.x, end.x) + tolerance ||
      point.y < Math.min(start.y, end.y) - tolerance ||
      point.y > Math.max(start.y, end.y) + tolerance
    ) {
      return false;
    }
    return this.pointToLineDistance(point, start, end) <= tolerance;
  }

  isPointInRectangle(point: Point, element: ExcalidrawElement): boolean {
    const { x, y, width, height } = this.getBoundingBox(element);
    return point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;
  }

  pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const closest = this.closestPointOnLineSegment(lineStart, lineEnd, point);
    return Math.sqrt((point.x - closest.x) ** 2 + (point.y - closest.y) ** 2);
  }

  private closestPointOnLineSegment(a: Point, b: Point, p: Point): Point {
    const ap = { x: p.x - a.x, y: p.y - a.y };
    const ab = { x: b.x - a.x, y: b.y - a.y };
    const ab2 = ab.x * ab.x + ab.y * ab.y;
    const ap_ab = ap.x * ab.x + ap.y * ab.y;
    const t = Math.max(0, Math.min(1, ap_ab / ab2));
    return { x: a.x + t * ab.x, y: a.y + t * ab.y };
  }

}