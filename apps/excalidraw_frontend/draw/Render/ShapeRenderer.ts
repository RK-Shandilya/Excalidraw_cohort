import { ExcalidrawElement } from "../types/types";

export class ShapeRenderer {
  constructor(private ctx: CanvasRenderingContext2D) {}

  renderRectangle(element: ExcalidrawElement) {
    this.ctx.save();
    this.ctx.translate(
      element.x + element.width / 2,
      element.y + element.height / 2
    );
    this.ctx.rotate((element.angle || 0) * Math.PI / 180);
    
    this.ctx.beginPath();
    this.ctx.rect(
      -element.width / 2,
      -element.height / 2,
      element.width || 0,
      element.height || 0
    );
    
    if (element.backgroundColor && element.backgroundColor !== "transparent") {
      this.ctx.fillStyle = element.backgroundColor;
      this.ctx.fill();
    }
    this.ctx.stroke();
    this.ctx.restore();
  }

  renderEllipse(element: ExcalidrawElement) {
    this.ctx.save();
    this.ctx.translate(
      element.x + element.width / 2,
      element.y + element.height / 2
    );
    this.ctx.rotate((element.angle || 0) * Math.PI / 180);

    this.ctx.beginPath();
    this.ctx.ellipse(
      0,
      0,
      Math.abs((element.width || 0) / 2),
      Math.abs((element.height || 0) / 2),
      0,
      0,
      Math.PI * 2
    );

    if (element.backgroundColor && element.backgroundColor !== "transparent") {
      this.ctx.fillStyle = element.backgroundColor;
      this.ctx.fill();
    }
    this.ctx.stroke();
    this.ctx.restore();
  }

  renderLine(element: ExcalidrawElement) {
    this.ctx.save();
    
    // Calculate the center point of the line
    const centerX = element.x + (element.width || 0) / 2;
    const centerY = element.y + (element.height || 0) / 2;
    
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate((element.angle || 0) * Math.PI / 180);

    // Draw the line relative to center
    const halfWidth = (element.width || 0) / 2;
    const halfHeight = (element.height || 0) / 2;

    this.ctx.beginPath();
    this.ctx.strokeStyle = element.strokeColor;
    this.ctx.lineWidth = element.strokeWidth;
    this.ctx.moveTo(-halfWidth, -halfHeight);
    this.ctx.lineTo(halfWidth, halfHeight);
    this.ctx.stroke();

    this.ctx.restore();
  }

  renderArrow(element: ExcalidrawElement) {
    this.ctx.save();
    
    // Calculate the center point
    const centerX = element.x + (element.width || 0) / 2;
    const centerY = element.y + (element.height || 0) / 2;
    
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate((element.angle || 0) * Math.PI / 180);

    const halfWidth = (element.width || 0) / 2;
    const halfHeight = (element.height || 0) / 2;

    // Draw the line
    this.ctx.beginPath();
    this.ctx.strokeStyle = element.strokeColor;
    this.ctx.lineWidth = element.strokeWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.moveTo(-halfWidth, -halfHeight);
    this.ctx.lineTo(halfWidth, halfHeight);
    this.ctx.stroke();

    // Draw the arrowhead
    const arrowLength = 10;
    const angle = Math.atan2(halfHeight, halfWidth);
    
    this.ctx.beginPath();
    this.ctx.moveTo(halfWidth, halfHeight);
    this.ctx.lineTo(
      halfWidth - arrowLength * Math.cos(angle - Math.PI / 6),
      halfHeight - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.lineTo(
      halfWidth - arrowLength * Math.cos(angle + Math.PI / 6),
      halfHeight - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.closePath();
    this.ctx.fillStyle = element.strokeColor;
    this.ctx.fill();

    this.ctx.restore();
  }
}