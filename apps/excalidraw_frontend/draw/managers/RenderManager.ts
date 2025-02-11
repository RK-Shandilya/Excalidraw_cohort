import { ExcalidrawElement } from "../types/types";
import { Camera } from "../Camera";
import { ShapeRenderer } from "../Render/ShapeRenderer";
import { FreeDrawRenderer } from "../Render/FreedrawRenderer";
import { TextRenderer } from "../Render/TextRenderer";
import { GridRenderer } from "../Render/GridRenderer";
import { SelectionManager } from "./SelectionManager";

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private shapeRenderer: ShapeRenderer;
  private freeDrawRenderer: FreeDrawRenderer;
  private textRenderer: TextRenderer;
  private gridRenderer: GridRenderer;

  public isDirty: Boolean = true

  constructor(canvas: HTMLCanvasElement, camera: Camera, private selectionManager: SelectionManager) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get 2D context");
    this.ctx = context;
    this.canvas = canvas;
    this.camera = camera;
    
    this.shapeRenderer = new ShapeRenderer(this.ctx);
    this.freeDrawRenderer = new FreeDrawRenderer(this.ctx);
    this.textRenderer = new TextRenderer(this.ctx);
    this.gridRenderer = new GridRenderer(this.ctx, this.camera);
  }

  private clear() {
    const { width, height } = this.ctx.canvas;
    this.ctx.clearRect(0, 0, width, height);
  }

  public markDirty() {
    console.log("Canvas marked as dirty");
    this.isDirty = true;
  }

  // In Renderer.ts
  public render(elements: ExcalidrawElement[]) {
    if (!this.isDirty) return;
  
    this.clear();
  
    const { width, height } = this.ctx.canvas;
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(0, 0, width, height);
    this.gridRenderer.drawGrid();
  
    this.ctx.save();
    this.camera.applyTransform(this.ctx);
  
    // Render elements first
    for (const element of elements) {
      console.log("In render",element);
      this.renderElement(element);
    }
  
    // Render selection box only if selectionBounds is valid
    const selectedElements = this.selectionManager.getSelectedElements();
    if (selectedElements.length > 0) {
      const selectionBox = this.selectionManager.renderSelectionBox();
      console.log("selectionBox", selectionBox);
      if (selectionBox) {
        console.log("Rendering Selection Box:", selectionBox.screenBounds);
        this.selectionManager.renderSelectionBox();
      }
    }
  
    this.ctx.restore();
  
    this.isDirty = false;
  }

  renderSelectionBox(box: { x: number; y: number; width: number; height: number ,angle: number }) {
    this.ctx.save();
    this.ctx.strokeStyle = "blue";
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 2]);
    this.ctx.strokeRect(box.x, box.y, box.width, box.height);
    this.ctx.rotate(box.angle);
    this.ctx.restore();
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