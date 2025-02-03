import { ExcalidrawElement, Point } from "../types/types";

export class Element {
    private ERASER_SIZE: number;
    constructor(ERASER_SIZE: number){
        this.ERASER_SIZE = ERASER_SIZE;
    }

    public isPointNearElement(
        point: Point,
        element: ExcalidrawElement
      ): boolean {
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

      public isPointNearRectangle(
        point: Point,
        element: ExcalidrawElement,
        tolerance: number
      ): boolean {
        const { x, y, width = 0, height = 0 } = element;
    
        // Check if point is near the rectangle edges
        return (
          point.x >= x - tolerance &&
          point.x <= x + width + tolerance &&
          point.y >= y - tolerance &&
          point.y <= y + height + tolerance &&
          (point.x <= x + tolerance ||
            point.x >= x + width - tolerance ||
            point.y <= y + tolerance ||
            point.y >= y + height - tolerance)
        );
      }

      public isPointNearEllipse(
        point: Point,
        element: ExcalidrawElement,
        tolerance: number
      ): boolean {
        const { x, y, width = 0, height = 0 } = element;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radiusX = width / 2;
        const radiusY = height / 2;
    
        const normalizedX = (point.x - centerX) / (radiusX + tolerance);
        const normalizedY = (point.y - centerY) / (radiusY + tolerance);
        const distance = normalizedX * normalizedX + normalizedY * normalizedY;
    
        return distance <= 1;
      }

      public isPointNearLine(
        point: Point,
        element: ExcalidrawElement,
        tolerance: number
      ): boolean {
        const start = { x: element.x, y: element.y };
        const end = {
          x: element.x + (element.width || 0),
          y: element.y + (element.height || 0),
        };
    
        const distance = this.pointToLineDistance(point, start, end);
        return distance <= tolerance;
      }

      public isPointInRectangle(
        point: Point,
        element: ExcalidrawElement
      ): boolean {
        return (
          point.x >= element.x &&
          point.x <= element.x + (element.width || 0) &&
          point.y >= element.y &&
          point.y <= element.y + (element.height || 0)
        );
      }

      public pointToLineDistance(
        point: Point,
        lineStart: Point,
        lineEnd: Point
      ): number {
        const numerator = Math.abs(
          (lineEnd.y - lineStart.y) * point.x -
            (lineEnd.x - lineStart.x) * point.y +
            lineEnd.x * lineStart.y -
            lineEnd.y * lineStart.x
        );
        const denominator = Math.sqrt(
          Math.pow(lineEnd.y - lineStart.y, 2) +
            Math.pow(lineEnd.x - lineStart.x, 2)
        );
        return numerator / denominator;
      }
}