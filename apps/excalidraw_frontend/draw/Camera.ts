import { Renderer } from "./managers/RenderManager";
import { Scene } from "./managers/SceneManager";
import { AppStateManager } from "./managers/StateManager";
import { AppState, Point, Viewport } from "./types/types";

// In Camera.ts
export class Camera {
  private viewport: Viewport;
  private isDragging: boolean = false;
  private lastMousePos: Point = { x: 0, y: 0 };
  private state: AppState | null = null;
  private renderer: Renderer | null = null;

  private lastRenderTime: number = 0;
  private readonly RENDER_THROTTLE: number = 16; // ~60 FPS

  constructor(
    private canvas: HTMLCanvasElement,
    private stateManager: AppStateManager, // Pass AppStateManager instead of state
    private scene: Scene
  ) {
    this.viewport = {
      offset: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      },
      zoom: 1,
    };

    // Subscribe to state updates
    this.stateManager.addUpdateListener((state: AppState) => {
      this.state = state; // Update the state when it changes
    });

    this.setupEventListeners();
  }

  public setRenderer(renderer: Renderer) {
    this.renderer = renderer;
  }

  public resetViewport(): void {
    this.viewport = {
      offset: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      },
      zoom: 1,
    };
    this.triggerRender();
  }

  public getViewport(): Viewport {
    return this.viewport;
  }

  public setViewport(viewport: Viewport): void {
    this.viewport = viewport;
    this.triggerRender();
  }

  public handleMouseDown = (e: MouseEvent): void => {
    console.log("tool in camera down",this.state?.currentTool);
    if (this.state?.currentTool !== "pan") {
      return; // Stop event propagation for non-pan tools
    }
    if (e.button === 0) { // Left mouse button
      this.isDragging = true;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
    }
  };

  public handleMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging || this.state?.currentTool !== "pan") {
      return;
    }

    const currentTime = Date.now();
    if (currentTime - this.lastRenderTime < this.RENDER_THROTTLE) {
      return; // Skip rendering if the throttle time hasn't passed
    }

    const dx = e.clientX - this.lastMousePos.x;
    const dy = e.clientY - this.lastMousePos.y;

    this.viewport.offset.x += dx;
    this.viewport.offset.y += dy;

    this.lastMousePos = { x: e.clientX, y: e.clientY };

    this.triggerRender();
    this.lastRenderTime = currentTime;
  };

  private handleMouseUp = (): void => {
    console.log("tool in camera up",this.state?.currentTool);
    this.isDragging = false;
  };

  // In Camera.ts
  private handleWheel = (e: WheelEvent): void => {
    e.preventDefault();

    const currentTime = Date.now();
    if (currentTime - this.lastRenderTime < this.RENDER_THROTTLE) {
      return; // Skip rendering if the throttle time hasn't passed
    }

    const { zoom, offset } = this.viewport;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - offset.x) / zoom;
    const worldY = (mouseY - offset.y) / zoom;

    const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05;
    const newZoom = Math.min(Math.max(0.1, zoom * zoomFactor), 5);

    if (newZoom !== zoom) {
      this.viewport.zoom = newZoom;
      this.viewport.offset.x = mouseX - worldX * newZoom;
      this.viewport.offset.y = mouseY - worldY * newZoom;

      this.triggerRender();
      this.lastRenderTime = currentTime;
    }
  };

  public screenToWorld(point: Point): Point {
    const zoom = this.getScale();
    const viewport = this.getViewport();
    
    return {
      x: (point.x - viewport.offset.x) / zoom,
      y: (point.y - viewport.offset.y) / zoom
    };
  }
  
  public worldToScreen(point: Point): Point {
    const zoom = this.getScale();
    const viewport = this.getViewport();
    
    return {
      x: (point.x * zoom) + viewport.offset.x,
      y: (point.y * zoom) + viewport.offset.y
    };
  }

  public applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(this.viewport.offset.x, this.viewport.offset.y);
    ctx.scale(this.viewport.zoom, this.viewport.zoom);
  }

  public restoreTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  public setupEventListeners() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
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

  // In Camera.ts
private triggerRender() {
  console.log("tool in camera triggerRender",this.state?.currentTool);
  console.log("renderer", this.renderer);
  console.log("scene", this.scene);
  if (this.renderer && this.scene) {
    console.log("Hello", this.renderer, this.scene)
    requestAnimationFrame(() => {
      console.log("inside frame");
      this.renderer!.isDirty = true;
      this.renderer!.render(this.scene!.getElements());
    });
  }
}
}