import { Point, Viewport } from "./types/types";

export class Camera {
  private viewport: Viewport;
  private scale: number = 1;

  private isDragging = false;
  private lastMousePos: Point = { x: 0, y: 0 };

  constructor(private canvas: HTMLCanvasElement) {
    console.log("Initializing camera class...", canvas);
    this.viewport = {
      offset: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      },
      zoom: 1
    };
    console.log("Initial viewport:", this.viewport); // Debugging log
    this.setupEventListeners();
  }

  public resetViewport() {
    this.viewport = {
      offset: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      },
      zoom: 1
    };
  }

  private setupEventListeners() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener("wheel", this.handleWheel);
  }

  public getViewport(): Viewport {
    return this.viewport;
  }

  public setViewport(viewport: Viewport) {
    this.viewport = viewport;
  }

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 1 || e.button === 2) {
      this.isDragging = true;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastMousePos.x;
    const dy = e.clientY - this.lastMousePos.y;

    this.viewport.offset.x += dx / this.viewport.zoom;
    this.viewport.offset.y += dy / this.viewport.zoom;

    this.lastMousePos = { x: e.clientX, y: e.clientY };
  };

  private handleMouseUp = () => {
    this.isDragging = false;
  };

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
  
    const zoom = this.viewport.zoom;
    const mouseX = e.clientX - this.canvas.offsetLeft;
    const mouseY = e.clientY - this.canvas.offsetTop;
  
    // Convert mouse position to world space before zoom
    const worldX = (mouseX - this.viewport.offset.x) / zoom;
    const worldY = (mouseY - this.viewport.offset.y) / zoom;
  
    // Calculate new zoom with smoother factor
    const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05;
    const newZoom = Math.min(Math.max(0.1, zoom * zoomFactor), 5);
    
    // Only update if zoom actually changed
    if (newZoom !== zoom) {
      this.viewport.zoom = newZoom;
      
      // Update offset to keep mouse position fixed in world space
      this.viewport.offset.x = mouseX - worldX * newZoom;
      this.viewport.offset.y = mouseY - worldY * newZoom;
    }
  };

  public pan(dx: number, dy: number) {
    const maxPan = 10000; // Prevent panning too far
    const newOffsetX = this.viewport.offset.x + dx / this.viewport.zoom;
    const newOffsetY = this.viewport.offset.y + dy / this.viewport.zoom;
    
    this.viewport.offset.x = Math.min(Math.max(-maxPan, newOffsetX), maxPan);
    this.viewport.offset.y = Math.min(Math.max(-maxPan, newOffsetY), maxPan);
  }

  screenToWorld(screenX: number, screenY: number): Point {
    return {
      x: (screenX - this.viewport.offset.x) / this.viewport.zoom,
      y: (screenY - this.viewport.offset.y) / this.viewport.zoom,
    };
  }

  worldToScreen(worldX: number, worldY: number): Point {
    return {
      x: worldX * this.viewport.zoom + this.viewport.offset.x,
      y: worldY * this.viewport.zoom + this.viewport.offset.y,
    };
  }

  applyTransform(ctx: CanvasRenderingContext2D) {
    console.log("Applying camera transform:", this.viewport); // Debugging log
    ctx.save();
    ctx.translate(this.viewport.offset.x, this.viewport.offset.y);
    ctx.scale(this.viewport.zoom, this.viewport.zoom);
  }

  restoreTransform(ctx: CanvasRenderingContext2D) {
    ctx.restore();
  }

  cleanup() {
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
    this.canvas.removeEventListener("wheel", this.handleWheel);
  }

  public getScale(): number {
    return this.scale;
  }
}