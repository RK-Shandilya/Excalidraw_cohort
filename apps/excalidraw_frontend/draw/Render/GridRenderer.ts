import { Camera } from "../Camera";

export class GridRenderer {
  constructor(private ctx: CanvasRenderingContext2D, private camera: Camera) {}

  drawGrid() {
    const { width, height } = this.ctx.canvas;
    const viewport = this.camera.getViewport();
    const gridSize = 20 * viewport.zoom;
    
    // Offset the grid based on camera position
    const offsetX = viewport.offset.x % gridSize;
    const offsetY = viewport.offset.y % gridSize;

    this.ctx.strokeStyle = "#f0f0f0";
    this.ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = offsetX; x < width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = offsetY; y < height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }
  }
}