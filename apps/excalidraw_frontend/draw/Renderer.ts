import { ExcalidrawElement } from "./types";
import { Camera } from "./Camera";
import { ShapeRenderer } from "./Render/ShapeRenderer";
import { FreeDrawRenderer } from "./Render/FreedrawRenderer";
import { TextRenderer } from "./Render/TextRenderer";
import { GridRenderer } from "./Render/GridRenderer";

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private shapeRenderer: ShapeRenderer;
  private freeDrawRenderer: FreeDrawRenderer;
  private textRenderer: TextRenderer;
  private gridRenderer: GridRenderer;

  constructor(canvas: HTMLCanvasElement, camera: Camera) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get 2D context");
    this.ctx = context;
    this.camera = camera;
    
    this.shapeRenderer = new ShapeRenderer(this.ctx);
    this.freeDrawRenderer = new FreeDrawRenderer(this.ctx);
    this.textRenderer = new TextRenderer(this.ctx);
    this.gridRenderer = new GridRenderer(this.ctx, this.camera);
  }

  clear() {
    const { width, height } = this.ctx.canvas;
    this.ctx.clearRect(0, 0, width, height);
  }

  render(elements: ExcalidrawElement[]) {
    // Clear the canvas
    this.clear();

    // Draw background and grid in screen space
    const { width, height } = this.ctx.canvas;
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(0, 0, width, height);
    this.gridRenderer.drawGrid();

    // Apply camera transform for all elements
    this.ctx.save();
    this.camera.applyTransform(this.ctx);

    // Render all elements
    for (const element of elements) {
      this.renderElement(element);
    }

    // Restore to screen space
    this.ctx.restore();
  }

  renderSelectionBox(selectionBox: React.ReactNode) {
    // Use a React portal or custom logic to render the selection box
    // For simplicity, we'll assume a method to render React components
    const container = document.createElement('div');
    document.body.appendChild(container);
    // this.render(selectionBox, container);
  }

  private renderElement(element: ExcalidrawElement) {
    if (element.isDeleted) return;
  
    this.ctx.save();
    this.setupElementStyle(element);
  
    switch (element.type) {
      case "rect":
        this.shapeRenderer.renderRectangle(element);
        break;
      case "circle":
        this.shapeRenderer.renderEllipse(element);
        break;
      case "pencil":
        if (element.isEraser) {
          this.freeDrawRenderer.eraseElement(element);
        } else {
          this.freeDrawRenderer.renderFreeDraw(element);
        }
        break;
      case "text":
        this.textRenderer.renderText(element);
        break;
      case "line":
        this.shapeRenderer.renderLine(element);
        break;
      case "arrow":
        this.shapeRenderer.renderArrow(element);
        break;
    }
  
    this.ctx.restore();
  }

  private setupElementStyle(element: ExcalidrawElement) {
    this.ctx.strokeStyle = element.strokeColor || "#000000";
    this.ctx.lineWidth = element.strokeWidth || 2;
    this.ctx.globalAlpha = element.opacity || 1;
  
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
}