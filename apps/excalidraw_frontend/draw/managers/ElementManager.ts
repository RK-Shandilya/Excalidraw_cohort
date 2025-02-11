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
    console.log("Element Found", elements);
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

  normalizeElementDimensions(element: ExcalidrawElement): ExcalidrawElement {
    let { x, y, width, height } = element;
    if (width < 0) {
      x += width;
      width = Math.abs(width);
    }
    if (height < 0) {
      y += height;
      height = Math.abs(height);
    }
    return { ...element, x, y, width, height };
  }

  getBoundingBox(element: ExcalidrawElement) {
    const { x, y, width = 0, height = 0, angle = 0 } = element;

    // Compute element center
    const cx = x + width / 2;
    const cy = y + height / 2;

    // Convert angle to radians
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Define the four corners relative to (x, y)
    const corners = [
        { x, y },                              // Top-left
        { x: x + width, y },                   // Top-right
        { x: x + width, y: y + height },       // Bottom-right
        { x, y: y + height },                  // Bottom-left
    ];

    // Rotate each corner around the center
    const rotatedCorners = corners.map((p) => {
        const dx = p.x - cx;
        const dy = p.y - cy;

        return {
            x: cx + dx * cos - dy * sin,
            y: cy + dx * sin + dy * cos,
        };
    });

    // Compute correct bounding box dimensions
    const minX = Math.min(...rotatedCorners.map(p => p.x));
    const maxX = Math.max(...rotatedCorners.map(p => p.x));
    const minY = Math.min(...rotatedCorners.map(p => p.y));
    const maxY = Math.max(...rotatedCorners.map(p => p.y));

    // Compute the actual rotated width and height
    const rotatedWidth = maxX - minX;
    const rotatedHeight = maxY - minY;

    return {
        x: minX,
        y: minY,
        width: rotatedWidth,
        height: rotatedHeight,
        angle
    };
}



  public resizeElement(element: ExcalidrawElement, newWidth: number, newHeight: number) {
    // Normalize the new width and height
    if (newWidth < 0) {
      element.x += newWidth; // Adjust x if width is negative
      newWidth = Math.abs(newWidth);
    }
    if (newHeight < 0) {
      element.y += newHeight; // Adjust y if height is negative
      newHeight = Math.abs(newHeight);
    }
  
    // Update the element's dimensions
    element.width = newWidth;
    element.height = newHeight;
  
    // Normalize the element again to ensure consistency
    const normalizedElement = this.normalizeElementDimensions(element);
    Object.assign(element, normalizedElement);
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