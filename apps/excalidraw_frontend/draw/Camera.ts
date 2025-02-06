import { AppState, Point, Viewport } from "./types/types";

export class Camera {
  private viewport: Viewport;
  private isDragging: boolean = false;
  private lastMousePos: Point = { x: 0, y: 0 };
  private state: AppState | null = null;

  constructor(private canvas: HTMLCanvasElement, state? : AppState) {
    // Initialize viewport: center of the window and a zoom level of 1.
    this.viewport = {
      offset: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      },
      zoom: 1,
    };
    this.state = state || null;
    this.setupEventListeners();
  }

  public resetViewport(): void {
    this.viewport = {
      offset: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      },
      zoom: 1,
    };
  }

  public getViewport(): Viewport {
    return this.viewport;
  }

  public setViewport(viewport: Viewport): void {
    this.viewport = viewport;
  }

  private handleMouseDown = (e: MouseEvent): void => {

    if (this.state?.currentTool !== "pan") {
      return; // Stop event propagation for non-pan tools
    }
    // Use the left mouse button (button 0) for dragging.
    if (e.button === 0) {
      this.isDragging = true;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
    }
  };

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;


    if (this.state?.currentTool !== "pan") {
      return; // Stop event propagation for non-pan tools
    }

    const dx = e.clientX - this.lastMousePos.x;
    const dy = e.clientY - this.lastMousePos.y;

    // Update the offset based on mouse movement.
    this.viewport.offset.x += dx;
    this.viewport.offset.y += dy;

    this.lastMousePos = { x: e.clientX, y: e.clientY };
  };

  private handleMouseUp = (): void => {
    this.isDragging = false;
  };

  private handleWheel = (e: WheelEvent): void => {
    e.preventDefault(); // Prevent default scrolling behavior

    const { zoom, offset } = this.viewport;
    // Use canvas bounding rect to compute correct mouse coordinates.
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert the mouse position from screen space to world space.
    const worldX = (mouseX - offset.x) / zoom;
    const worldY = (mouseY - offset.y) / zoom;

    // Apply a zoom factor based on scroll delta.
    const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05;
    const newZoom = Math.min(Math.max(0.1, zoom * zoomFactor), 5);

    // Only update if there is a change in zoom.
    if (newZoom !== zoom) {
      this.viewport.zoom = newZoom;
      // Adjust offset to keep the world coordinate under the mouse fixed.
      this.viewport.offset.x = mouseX - worldX * newZoom;
      this.viewport.offset.y = mouseY - worldY * newZoom;
    }
  };

  public pan(dx: number, dy: number): void {
    this.viewport.offset.x += dx;
    this.viewport.offset.y += dy;
  }

  public screenToWorld(screenX: number, screenY: number): Point {
    return {
      x: (screenX - this.viewport.offset.x) / this.viewport.zoom,
      y: (screenY - this.viewport.offset.y) / this.viewport.zoom,
    };
  }

  public worldToScreen(worldX: number, worldY: number): Point {
    return {
      x: worldX * this.viewport.zoom + this.viewport.offset.x,
      y: worldY * this.viewport.zoom + this.viewport.offset.y,
    };
  }

  /**
   * Apply the current camera transform to the canvas context.
   * Saves the context so that subsequent restoreTransform() reverts the changes.
   */
  public applyTransform(ctx: CanvasRenderingContext2D): void {
    console.log("apply Transform");
    ctx.save(); // Save current context state.
    // Reset the transform to a known state.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Apply camera translation and scaling.
    ctx.translate(this.viewport.offset.x, this.viewport.offset.y);
    ctx.scale(this.viewport.zoom, this.viewport.zoom);
  }

  /**
   * Restore the canvas context state.
   * This should be called after all drawing operations are complete.
   */
  public restoreTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  public setupEventListeners(){
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener("wheel", this.handleWheel);
  }

  public cleanup(): void {
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
    this.canvas.removeEventListener("wheel", this.handleWheel);
  }

  public getScale(): number {
    return this.viewport.zoom;
  }
}
