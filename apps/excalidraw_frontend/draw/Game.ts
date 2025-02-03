import { Camera } from "./Camera";
import { Renderer } from "./Renderer";
import { Scene } from "./Scene";
import { AppState, ExcalidrawElement, Point } from "./types/types";
import { UndoRedoManager } from "./managers/UndoRedoManager";
import { ToolManager } from "./managers/ToolManager";

export class Game {
  private camera: Camera;
  private renderer: Renderer;
  private socket: WebSocket;
  private roomId: string;
  public scene: Scene;
  private state: AppState;
  private undoRedoManager: UndoRedoManager;
  private toolManager: ToolManager;
  private canvas: HTMLCanvasElement;
  private selectionCallback?: (element: ExcalidrawElement | null) => void;
  private elementUpdateCallback?: (elements: ExcalidrawElement[]) => void;
  private shouldRender = true;
  
  private eraserPath: Point[] = [];
  private eraserElement: ExcalidrawElement | null = null;
  private eraserCursor: HTMLDivElement | null = null;
  private ERASER_SIZE = 20;
  private lastRenderTime = 0;
  private readonly RENDER_THROTTLE = 16; // ~60fps
  private isDrawing = false;

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    console.log("Initializing Game class...", canvas);
    this.canvas = canvas;
    this.camera = new Camera(canvas);
    this.scene = new Scene();
    this.renderer = new Renderer(canvas, this.camera);
    this.socket = socket;
    this.roomId = roomId;
    
    this.canvas.addEventListener("mouseleave", this.handleMouseLeave);

    this.createEraserCursor();
    this.startRenderLoop();

    this.state = {
      currentTool: "selection",
      draggingElement: null,
      selectedElements: [],
      isResizing: false,
      isRotating: false,
      isPanning: false,
      startBoundingBox: null,
    };

    this.undoRedoManager = new UndoRedoManager();
    this.toolManager = new ToolManager(this.state);

    this.setupEventListeners();
    this.setupSceneListener();
    this.startRenderLoop();
  }

  private createEraserCursor() {
    this.eraserCursor = document.createElement("div");
    const style = this.eraserCursor.style;
    style.position = "fixed";
    style.width = `${this.ERASER_SIZE}px`;
    style.height = `${this.ERASER_SIZE}px`;
    style.border = "1.5px solid #666";
    style.borderRadius = "50%";
    style.pointerEvents = "none";
    style.display = "none";
    style.zIndex = "1000";
    document.body.appendChild(this.eraserCursor);
  }

  public renderSelectionBox() {
    if (!this.state.selectedElements.length) return null;
    
    const element = this.state.selectedElements[0];
    if (!element) return null;
  
    // Convert world coordinates to screen coordinates
    const screenPos = this.camera.worldToScreen(element.x, element.y);
    const zoom = this.camera.getViewport().zoom; // Use zoom from viewport
    
    return {
      element,
      screenBounds: {
        x: screenPos.x,
        y: screenPos.y,
        width: (element.width || 0) * zoom,
        height: (element.height || 0) * zoom,
        angle: element.angle || 0
      }
    };
  }

  public clearSelection() {
    if (this.state.selectedElements.length > 0) {
      this.state.selectedElements = [];
      if (this.selectionCallback) {
        this.selectionCallback(null);
      }
      this.render();
    }
  }

  public isClickingElement(e: MouseEvent): boolean {
    const point = this.camera.screenToWorld(e.offsetX, e.offsetY);
    const clickedElement = this.findElementAtPoint(point);
    return clickedElement !== null;
  }

  get elements(): ExcalidrawElement[] {
    return this.scene.getElements();
  }

  get selectedElement(): ExcalidrawElement | null {
    return this.state.selectedElements[0] || null;
  }

  set selectedElement(element: ExcalidrawElement | null) {
    this.setSelectedElements(element ? [element] : []);
  }

  private showEraserCursor(x: number, y: number) {
    if (!this.eraserCursor) return;

    this.eraserCursor.style.display = "block";
    this.eraserCursor.style.left = `${x - this.ERASER_SIZE / 2}px`;
    this.eraserCursor.style.top = `${y - this.ERASER_SIZE / 2}px`;
  }

  private hideEraserCursor() {
    if (this.eraserCursor) {
      this.eraserCursor.style.display = "none";
    }
  }

  private setupSceneListener() {
    // Listen for changes in the scene (e.g., when elements are added, updated, or deleted)
    this.scene.addUpdateListener((elements: ExcalidrawElement[]) => {
      // Re-render the canvas whenever the scene changes
      this.render();

      // Notify external listeners (e.g., for undo/redo or WebSocket updates)
      if (this.elementUpdateCallback) {
        this.elementUpdateCallback(elements);
      }

      // Optionally, send updates to the server via WebSocket
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(
          JSON.stringify({
            type: "scene-update",
            roomId: this.roomId,
            elements: elements,
          })
        );
      }
    });
  }

  public resetCamera() {
    this.camera.resetViewport();
    this.render();
  }

  private setupEventListeners() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener("dblclick", this.handleDoubleClick);
  }

  private handleDoubleClick = (event: MouseEvent) => {
    const point = this.camera.screenToWorld(event.clientX, event.clientY);

    // Check if we clicked on an existing text element
    const element = this.findElementAtPoint(point);
    if (element?.type === "text") {
      this.editExistingText(element, event.clientX, event.clientY);
    } else if (this.state.currentTool === "text") {
      this.createTextInputField(point, event.clientX, event.clientY);
    }
  };

  private editExistingText(
    element: ExcalidrawElement,
    screenX: number,
    screenY: number
  ) {
    const input = this.createInputElement(screenX, screenY);
    input.value = element.text || "";

    const originalElement = { ...element };

    input.onblur = () => {
      const newText = input.value.trim();
      if (newText && newText !== originalElement.text) {
        this.scene.updateElement({
          ...element,
          text: newText,
        });
      } else if (!newText) {
        // Remove element if text is empty
        element.isDeleted = true;
        this.scene.updateElement(element);
      }
      document.body.removeChild(input);
      this.render();
    };

    document.body.appendChild(input);
    input.focus();
    input.select(); // Select all text for easy editing
  }

  private createInputElement(
    screenX: number,
    screenY: number
  ): HTMLTextAreaElement {
    const textarea = document.createElement("textarea");
    const style = textarea.style;

    style.position = "fixed";
    style.left = `${screenX}px`;
    style.top = `${screenY}px`;
    style.minWidth = "50px";
    style.minHeight = "30px";
    style.padding = "4px";
    style.border = "none";
    style.outline = "none";
    style.overflow = "hidden";
    style.resize = "none";
    style.background = "transparent";
    style.font = `${20}px Arial`;
    style.color = "#000";
    style.zIndex = "1000";
    style.whiteSpace = "pre";

    // Auto-resize as user types
    textarea.addEventListener("input", () => {
      style.height = "auto";
      style.width = "auto";
      style.height = `${textarea.scrollHeight}px`;
      style.width = `${textarea.scrollWidth}px`;
    });

    return textarea;
  }

  private handleMouseDown = (event: MouseEvent) => {
    this.isDrawing = true;
    const point = this.camera.screenToWorld(event.clientX, event.clientY);
  
    if (this.state.currentTool === "pan") {
      this.state.isPanning = true;
      return;
    }
  
    if (this.state.currentTool === "selection") {
      const clickedElement = this.findElementAtPoint(point);
      if (clickedElement) {
        this.handleSelection(point);
        // Don't clear selection when clicking on an element
        event.stopPropagation();
      }
      return;
    }
  
    // Handle other tools (rect, circle, line, etc.)
    if (["rect", "circle", "line", "arrow"].includes(this.state.currentTool)) {
      this.startDrawingShape(
        point,
        this.state.currentTool as "rect" | "circle" | "line" | "arrow"
      );
    } else if (this.state.currentTool === "pencil") {
      this.startFreeDraw(point);
    } else if (this.state.currentTool === "eraser") {
      this.startErasing(point);
    }
  };

  private handleMouseLeave = () => {
    this.hideEraserCursor();
    if (this.state.isPanning) {
      this.state.isPanning = false;
    }
    if (this.state.draggingElement) {
      this.handleMouseUp();
    }
  };

  private startRenderLoop() {
    const animate = () => {
      // Remove the isDrawing check and use shouldRender instead
      if (this.shouldRender) {
        const currentTime = Date.now();
        if (currentTime - this.lastRenderTime >= this.RENDER_THROTTLE) {
          this.render();
          this.lastRenderTime = currentTime;
        }
      }
      requestAnimationFrame(animate);
    };
    animate();
  }

  private startErasing(point: Point) {
    this.eraserPath = [point];

    // Create a visual element for the eraser path
    this.eraserElement = {
      id: crypto.randomUUID(),
      type: "pencil",
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      angle: 0,
      strokeColor: "rgba(144, 144, 144, 0.1)", // Very light gray
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: this.ERASER_SIZE,
      roughness: 0,
      opacity: 0.3,
      points: [point],
      isEraser: true,
    };

    this.state.draggingElement = this.eraserElement;
    this.scene.addElement(this.eraserElement);
  }

  private startDrawingShape(
    point: Point,
    type: "rect" | "circle" | "line" | "arrow"
  ) {
    const element: ExcalidrawElement = {
      id: crypto.randomUUID(),
      type, // Use "rect", "circle", "line", or "arrow"
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      angle: 0,
      strokeColor: "#000000",
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 2,
      roughness: 1,
      opacity: 1,
    };
    this.state.draggingElement = element;
    this.scene.addElement(element);
  }

  private startFreeDraw(point: Point) {
    const element: ExcalidrawElement = {
      id: crypto.randomUUID(),
      type: "pencil",
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      angle: 0,
      strokeColor: "#000000",
      backgroundColor: "",
      fillStyle: "solid",
      strokeWidth: 2,
      roughness: 1,
      opacity: 1,
      points: [point],
    };

    this.state.draggingElement = element;
    this.scene.addElement(element);
  }

  private createTextInputField(
    worldPoint: Point,
    screenX: number,
    screenY: number
  ) {
    const textarea = this.createInputElement(screenX, screenY);

    textarea.onblur = () => {
      const text = textarea.value.trim();
      if (text) {
        const element: ExcalidrawElement = {
          id: crypto.randomUUID(),
          type: "text",
          x: worldPoint.x,
          y: worldPoint.y,
          width: textarea.offsetWidth,
          height: textarea.offsetHeight,
          angle: 0,
          strokeColor: "#000000",
          backgroundColor: "transparent",
          fillStyle: "solid",
          strokeWidth: 1,
          roughness: 1,
          opacity: 1,
          text: text,
          fontSize: 20,
          fontFamily: "Arial",
          textAlign: "left",
        };

        this.scene.addElement(element);
        this.render();
      }

      document.body.removeChild(textarea);
    };

    textarea.onkeydown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        textarea.blur();
      }
      if (e.key === "Escape") {
        textarea.value = "";
        textarea.blur();
      }
    };

    document.body.appendChild(textarea);
    textarea.focus();
  }

  private handleSelection(point: Point) {
    const element = this.findElementAtPoint(point);
    
    if (element) {
      this.state.selectedElements = [element];
      if (this.selectionCallback) {
        this.selectionCallback(element);
      }
    }
    
    this.render();
  }

  // for checking point in inside or on the element
  
  private findElementAtPoint(point: Point): ExcalidrawElement | null {
    const elements = this.scene.getElements();
    // Iterate in reverse to get the top-most element
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      if (this.isPointInElement(point, element)) {
        return element;
      }
    }
    return null;
  }

  private isPointInElement(point: Point, element: ExcalidrawElement): boolean {
    return (
      point.x >= element.x &&
      point.x <= element.x + (element.width || 0) &&
      point.y >= element.y &&
      point.y <= element.y + (element.height || 0)
    );
  }

  public setElements(elements: ExcalidrawElement[]) {
    // Clear the current scene
    this.scene = new Scene();

    // Add the new elements to the scene
    elements.forEach((element) => this.scene.addElement(element));

    // Re-render the canvas
    this.render();

    // Notify listeners about the update
    if (this.elementUpdateCallback) {
      this.elementUpdateCallback(elements);
    }
  }

  private handleMouseMove = (event: MouseEvent) => {
    // Only show eraser cursor when eraser tool is selected
    if (this.state.currentTool === "eraser") {
      this.showEraserCursor(event.clientX, event.clientY);
    }

    if (!this.isDrawing) return; // Skip processing if not drawing

    const point = this.camera.screenToWorld(event.clientX, event.clientY);

    if (this.state.isPanning) {
      this.camera.pan(event.movementX, event.movementY);
      this.render();
      return;
    }

    if (this.state.draggingElement) {
      if (this.state.currentTool === "eraser") {
        this.updateEraserPath(point);
      } else if (this.state.draggingElement.type === "pencil") {
        // Throttle points for pencil tool
        const lastPoint = this.state.draggingElement.points?.at(-1);
        if (lastPoint && this.getDistance(lastPoint, point) > 2) {
          this.state.draggingElement.points?.push(point);
          // Don't call render here - it'll be handled by the render loop
        }
      } else {
        this.state.draggingElement.width =
          point.x - this.state.draggingElement.x;
        this.state.draggingElement.height =
          point.y - this.state.draggingElement.y;
      }
      this.scene.updateElement(this.state.draggingElement);
    }
  };

  private updateEraserPath(point: Point) {
    if (!this.eraserElement?.points) return;
  
    const lastPoint = this.eraserPath[this.eraserPath.length - 1];
    if (!lastPoint) return;
  
    this.eraserPath.push(point);
    this.eraserElement.points.push(point);
  
    const elements = this.scene.getElements();
    for (const element of elements) {
      if (element.isDeleted || element === this.eraserElement) continue;
  
      if (element.type === "pencil" && element.points) {
        this.handlePencilErase(element, point);
      } else if (this.isPointNearElement(point, element)) {
        element.isDeleted = true;
        this.scene.updateElement(element);
      }
    }
  }

  private handlePencilErase(element: ExcalidrawElement, eraserPoint: Point) {
    if (!element.points) return;

    // Create new segments that don't intersect with the eraser
    let newSegments: Point[][] = [];
    let currentSegment: Point[] = [];

    for (const point of element.points) {
      const distance = Math.hypot(
        point.x - eraserPoint.x,
        point.y - eraserPoint.y
      );

      if (distance > this.ERASER_SIZE / 2) {
        currentSegment.push(point);
      } else {
        if (currentSegment.length > 1) {
          newSegments.push([...currentSegment]);
        }
        currentSegment = [];
      }
    }

    if (currentSegment.length > 1) {
      newSegments.push(currentSegment);
    }

    // Create new elements for each segment
    if (newSegments.length > 0) {
      element.isDeleted = true;
      this.scene.updateElement(element);

      for (const segment of newSegments) {
        const newElement: ExcalidrawElement = {
          ...element,
          id: crypto.randomUUID(),
          points: segment,
          isDeleted: false,
        };
        this.scene.addElement(newElement);
      }
    } else if (newSegments.length === 0) {
      // If no segments remain, delete the entire element
      element.isDeleted = true;
      this.scene.updateElement(element);
    }
  }

  private isPointNearElement(
    point: Point,
    element: ExcalidrawElement
  ): boolean {
    const tolerance = this.ERASER_SIZE / 2;

    switch (element.type) {
      case "rect":
        return this.isPointNearRectangle(point, element, tolerance);
      case "circle":
        return this.isPointNearEllipse(point, element, tolerance);
      case "line":
      case "arrow":
        return this.isPointNearLine(point, element, tolerance);
      case "text":
        return this.isPointInRectangle(point, element);
      default:
        return false;
    }
  }

  private isPointNearRectangle(
    point: Point,
    element: ExcalidrawElement,
    tolerance: number
  ): boolean {
    const { x, y, width = 0, height = 0 } = element;

    // Check if point is near the rectangle edges
    return (
      point.x >= x - tolerance &&
      point.x <= x + width + tolerance &&
      point.y >= y - tolerance &&
      point.y <= y + height + tolerance &&
      (point.x <= x + tolerance ||
        point.x >= x + width - tolerance ||
        point.y <= y + tolerance ||
        point.y >= y + height - tolerance)
    );
  }

  private isPointNearEllipse(
    point: Point,
    element: ExcalidrawElement,
    tolerance: number
  ): boolean {
    const { x, y, width = 0, height = 0 } = element;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radiusX = width / 2;
    const radiusY = height / 2;

    const normalizedX = (point.x - centerX) / (radiusX + tolerance);
    const normalizedY = (point.y - centerY) / (radiusY + tolerance);
    const distance = normalizedX * normalizedX + normalizedY * normalizedY;

    return distance <= 1;
  }

  private isPointNearLine(
    point: Point,
    element: ExcalidrawElement,
    tolerance: number
  ): boolean {
    const start = { x: element.x, y: element.y };
    const end = {
      x: element.x + (element.width || 0),
      y: element.y + (element.height || 0),
    };

    const distance = this.pointToLineDistance(point, start, end);
    return distance <= tolerance;
  }

  private isPointInRectangle(
    point: Point,
    element: ExcalidrawElement
  ): boolean {
    return (
      point.x >= element.x &&
      point.x <= element.x + (element.width || 0) &&
      point.y >= element.y &&
      point.y <= element.y + (element.height || 0)
    );
  }

  private pointToLineDistance(
    point: Point,
    lineStart: Point,
    lineEnd: Point
  ): number {
    const numerator = Math.abs(
      (lineEnd.y - lineStart.y) * point.x -
        (lineEnd.x - lineStart.x) * point.y +
        lineEnd.x * lineStart.y -
        lineEnd.y * lineStart.x
    );
    const denominator = Math.sqrt(
      Math.pow(lineEnd.y - lineStart.y, 2) +
        Math.pow(lineEnd.x - lineStart.x, 2)
    );
    return numerator / denominator;
  }

  private handleMouseUp = () => {
    this.isDrawing = false;
    this.state.isPanning = false;
    
    if (this.state.draggingElement) {
        if (this.state.currentTool === "eraser") {
            // Remove the visual eraser path
            if (this.eraserElement) {
                this.eraserElement.isDeleted = true;
                this.scene.updateElement(this.eraserElement);
            }
            this.eraserPath = [];
            this.eraserElement = null;
        } else {
            if (
                this.state.draggingElement.type === "rect" ||
                this.state.draggingElement.type === "circle"
            ) {
                this.normalizeElementDimensions(this.state.draggingElement);
            }
            this.scene.updateElement(this.state.draggingElement);
        }
        this.state.draggingElement = null;
    }
    
    this.render();
};

  private getDistance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  private normalizeElementDimensions(element: ExcalidrawElement) {
    if (element.width < 0) {
      element.x += element.width;
      element.width = Math.abs(element.width);
    }
    if (element.height < 0) {
      element.y += element.height;
      element.height = Math.abs(element.height);
    }
  }

  public setTool(tool: AppState["currentTool"]) {
    this.toolManager.setTool(tool);
    this.state.currentTool = tool;
  }

  public setSelectedElements(elements: ExcalidrawElement[]) {
    this.state.selectedElements = elements;
    // Don't trigger the callback here as it should be handled by the caller
  }

  // Property setters for selected elements
  public setStrokeColor(color: string) {
    this.updateSelectedElements({ strokeColor: color });
  }

  public setFillColor(color: string) {
    this.updateSelectedElements({ backgroundColor: color });
  }

  public setStrokeWidth(width: number) {
    this.updateSelectedElements({ strokeWidth: width });
  }

  public setOpacity(opacity: number) {
    this.updateSelectedElements({ opacity });
  }

  public setFontSize(size: number) {
    this.updateSelectedElements({ fontSize: size });
  }

  public setStrokeStyle(style: "solid" | "dashed" | "dotted") {
    this.updateSelectedElements({ strokeStyle: style });
  }

  public setFontFamily(family: string) {
    this.updateSelectedElements({ fontFamily: family });
  }

  public setTextAlign(align: "left" | "center" | "right") {
    this.updateSelectedElements({ textAlign: align });
  }

  private updateSelectedElements(props: Partial<ExcalidrawElement>) {
    this.state.selectedElements.forEach((element) => {
      const updatedElement = { ...element, ...props };
      this.scene.updateElement(updatedElement);
    });
    this.render();
  }

  public onSelectionChange(
    callback: (element: ExcalidrawElement | null) => void
  ) {
    this.selectionCallback = callback;
  }

  public onElementUpdate(callback: (elements: ExcalidrawElement[]) => void) {
    this.elementUpdateCallback = callback;
  }

  render() {
    this.renderer.render(this.scene.getElements());
  }

  destroy() {
    this.shouldRender = false;
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
    this.canvas.removeEventListener("mouseleave", this.handleMouseLeave);
    if (this.eraserCursor) {
      document.body.removeChild(this.eraserCursor);
      this.eraserCursor = null;
    }
    this.camera.cleanup();
  }
}
