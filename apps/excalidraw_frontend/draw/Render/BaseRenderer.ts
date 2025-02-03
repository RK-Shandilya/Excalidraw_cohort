import { ExcalidrawElement } from "../types/types";

export abstract class BaseRenderer {
  constructor(protected ctx: CanvasRenderingContext2D) {}

  protected setupElementStyle(element: ExcalidrawElement) {
    this.ctx.strokeStyle = element.strokeColor;
    this.ctx.lineWidth = element.strokeWidth;
    this.ctx.globalAlpha = element.opacity;

    if (element.strokeStyle) {
      switch (element.strokeStyle) {
        case "dashed":
          this.ctx.setLineDash([5, 5]);
          break;
        case "dotted":
          this.ctx.setLineDash([2, 2]);
          break;
        default:
          this.ctx.setLineDash([]);
      }
    }
  }

  abstract render(element: ExcalidrawElement): void;
}