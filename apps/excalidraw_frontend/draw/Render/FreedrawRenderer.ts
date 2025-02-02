import { ExcalidrawElement } from "../types";

export class FreeDrawRenderer {
  constructor(private ctx: CanvasRenderingContext2D) {}

  renderFreeDraw(element: ExcalidrawElement) {
    if (!element.points || element.points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.moveTo(element.points[0].x, element.points[0].y);

    for (let i = 1; i < element.points.length; i++) {
      const point = element.points[i];
      this.ctx.lineTo(point.x, point.y);
    }

    if (element.backgroundColor && element.backgroundColor !== "transparent") {
      this.ctx.fillStyle = element.backgroundColor;
      this.ctx.fill();
    }
    
    this.ctx.stroke();
  }

  eraseElement(element: ExcalidrawElement) {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
    this.ctx.lineWidth = element.strokeWidth || 10;

    if (element.type === "pencil" && element.points && element.points.length > 1) {
      this.ctx.beginPath();
      this.ctx.moveTo(element.points[0].x, element.points[0].y);
      for (let i = 1; i < element.points.length; i++) {
        const point = element.points[i];
        this.ctx.lineTo(point.x, point.y);
      }
      this.ctx.stroke();
    }

    this.ctx.restore();
  }
}