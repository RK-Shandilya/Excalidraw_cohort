import { ExcalidrawElement } from "../types";

export class ShapeRenderer {
  constructor(private ctx: CanvasRenderingContext2D) {}

  renderRectangle(element: ExcalidrawElement) {
    this.ctx.beginPath();
    this.ctx.rect(element.x, element.y, element.width || 0, element.height || 0);
    
    if (element.backgroundColor && element.backgroundColor !== "transparent") {
      this.ctx.fillStyle = element.backgroundColor;
      this.ctx.fill();
    }
    
    this.ctx.stroke();
  }

  renderEllipse(element: ExcalidrawElement) {
    const centerX = element.x + (element.width || 0) / 2;
    const centerY = element.y + (element.height || 0) / 2;
    const radiusX = (element.width || 0) / 2;
    const radiusY = (element.height || 0) / 2;

    this.ctx.beginPath();
    this.ctx.ellipse(centerX, centerY, Math.abs(radiusX), Math.abs(radiusY), 0, 0, Math.PI * 2);
    
    if (element.backgroundColor && element.backgroundColor !== "transparent") {
      this.ctx.fillStyle = element.backgroundColor;
      this.ctx.fill();
    }
    
    this.ctx.stroke();
  }

  renderLine(element: ExcalidrawElement) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = element.strokeColor;
    this.ctx.lineWidth = element.strokeWidth;
    this.ctx.moveTo(element.x, element.y);
    this.ctx.lineTo(element.x + (element.width || 0), element.y + (element.height || 0));
    this.ctx.stroke();
  }

  renderArrow(element: ExcalidrawElement) {
    const endX = element.x + (element.width || 0);
    const endY = element.y + (element.height || 0);
  
    // Draw the line
    this.ctx.beginPath();
    this.ctx.strokeStyle = element.strokeColor;
    this.ctx.lineWidth = element.strokeWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.moveTo(element.x, element.y);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
  
    // Draw the arrowhead
    const arrowLength = 10;
    const angle = Math.atan2(endY - element.y, endX - element.x);
  
    this.ctx.beginPath();
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - arrowLength * Math.cos(angle - Math.PI / 6),
      endY - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.lineTo(
      endX - arrowLength * Math.cos(angle + Math.PI / 6),
      endY - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.closePath();
    this.ctx.fillStyle = element.strokeColor;
    this.ctx.fill();
  }
}