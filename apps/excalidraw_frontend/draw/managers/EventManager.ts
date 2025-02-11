import { Camera } from "../Camera";
import { AppState, ExcalidrawElement, Point } from "../types/types";
import { DrawingManager } from "./DrawingManager";
import { ElementManager } from "./ElementManager";
import { AppStateManager } from "./StateManager";
import { EraserTool } from "./EraserManager";
import { Renderer } from "./RenderManager";
import { Scene } from "./SceneManager";
import { SelectionManager } from "./SelectionManager";

export class EventManager {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private scene: Scene;
  private camera: Camera;
  private state: AppState;
  private drawingManager: DrawingManager;
  private isDrawing: boolean = false;
  private selectionManager: SelectionManager;
  private eraserManager: EraserTool;
  private stateManager: AppStateManager;
  private elementManager: ElementManager;
  private shouldRender: boolean = false;
  private socket: WebSocket;
  private roomId: string;

  private lastMousePos: Point = { x: 0, y: 0 }

  private elementUpdateCallback?: (elements: ExcalidrawElement[]) => void;

  constructor(
    canvas: HTMLCanvasElement,
    renderer: Renderer,
    scene: Scene,
    camera: Camera,
    state: AppState,
    drawingManager: DrawingManager,
    selectionManager: SelectionManager,
    eraserManager: EraserTool,
    elementManager: ElementManager,
    stateManager: AppStateManager,
    socket: WebSocket,
    roomId: string
  ) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.state = state;
    this.drawingManager = drawingManager;
    this.selectionManager = selectionManager;
    this.eraserManager = eraserManager;
    this.elementManager = elementManager;
    this.stateManager = stateManager;
    this.roomId = roomId;
    this.socket = socket;

    this.stateManager.addUpdateListener((state) => {
      this.handleAppStateUpdate(state);
    });
  }

  private handleAppStateUpdate(state: AppState) {
    this.state = state;
  }

  // In EventManager.ts
private handleMouseDown = (event: MouseEvent) => {
  this.isDrawing = true;

  if (this.state.currentTool === "pan") {
    this.stateManager.setPanning(true);
    this.camera.handleMouseDown(event); // Delegate to Camera
    return;
  }

  const point = this.camera.screenToWorld({ x: event.clientX, y: event.clientY });

  if (this.state.currentTool === "selection") {
    const clickedElement = this.elementManager.findElementAtPoint(point);
    if (clickedElement) {
      this.selectionManager.handleSelection(point, event.shiftKey);
      this.selectionManager.setSelectedElements([clickedElement]);
      event.stopPropagation();
    } else {
      // Clicked empty space
      this.selectionManager.setSelectedElements([]);
      this.selectionManager.clearSelection();
    }
    return;
  }

  this.handleDrawingTools(point, event);
};

private handleMouseMove = (event: MouseEvent) => {
  if (this.state.currentTool === "eraser" && this.isDrawing) {
    const point = this.camera.screenToWorld({x:event.clientX, y:event.clientY});
    this.eraserManager.updateEraserPath(point);
    this.eraserManager.showEraserCursor(event.clientX, event.clientY);
  }

  if (this.state.currentTool === "pan" && this.state.isPanning) {
    this.camera.handleMouseMove(event); // Delegate to Camera
    return;
  }

  if (!this.isDrawing) return;

  const point = this.camera.screenToWorld({x:event.clientX, y:event.clientY});

  if (this.state.draggingElement) {
    this.handleDragging(point);
  }
};

  private handleDrawingTools(point: Point, event: MouseEvent) {
    let element;

    if (this.state.currentTool === "text") {
      this.handleTextInput(event.clientX, event.clientY);
      return;
    } else if (["rect", "circle", "line", "arrow"].includes(this.state.currentTool)) {
      element = this.drawingManager.startDrawingShape(
        point,
        this.state.currentTool as "rect" | "circle" | "line" | "arrow"
      );
    } else if (this.state.currentTool === "pencil") {
      element = this.drawingManager.startFreeDraw(point);
    } else if (this.state.currentTool === "eraser") {
      element = this.eraserManager.startErasing(point);
    }
    this.stateManager.setDraggingElement(element!);
    this.setupSceneListener();
  }

  private handleMouseLeave = () => {
    this.eraserManager.hideEraserCursor();
    if (this.state.isPanning) {
      this.stateManager.setPanning(false);
    }
    if (this.state.draggingElement) {
      this.stateManager.setDraggingElement(null);
      this.setupSceneListener();
    }
  };

  // In EventManager.ts
  private handleMouseUp = () => {
    this.isDrawing = false;
    this.stateManager.setPanning(false);
  
    if (this.state.draggingElement) {
      if (this.state.currentTool === "eraser") {
        this.eraserManager.removeEraserPath();
        this.eraserManager.hideEraserCursor();
      } else {
        this.scene.updateElement(this.state.draggingElement);
      }
      this.stateManager.setDraggingElement(null);
    }
    this.renderer.render(this.scene.getElements());
  };

  // Method to handle element dragging
  private handleDragging(point: Point) {
    if (this.state.currentTool === "eraser") {
      this.eraserManager.updateEraserPath(point); 
    } else if (this.state.draggingElement?.type === "pencil") {
      this.handlePencilDrawing(point);
      if (this.state.draggingElement) {
        this.scene.updateElement(this.state.draggingElement);
      }
    } else {
      if (this.state.draggingElement) {
        this.state.draggingElement.width =
          point.x - this.state.draggingElement.x;
        this.state.draggingElement.height =
          point.y - this.state.draggingElement.y;
        this.scene.updateElement(this.state.draggingElement);
      }
    }
    this.renderer.render(this.scene.getElements());
  }

  // Method to handle pencil drawing
  private handlePencilDrawing(point: Point) {
    const lastPoint = this.state.draggingElement?.points?.at(-1);
    if (lastPoint && this.elementManager.getDistance(lastPoint, point) > 2) {
      this.state.draggingElement?.points?.push(point);
    }
  }

  private handleTextInput(screenX: number, screenY: number) {
    if (document.querySelector("textarea")) return; // Prevent duplicate inputs

    const textarea = this.drawingManager.createInputElement(screenX, screenY);
    document.body.appendChild(textarea);
    textarea.focus();

    textarea.addEventListener("blur", () => {
      if (textarea.value.trim()) {
        const textElement = this.drawingManager.startTextInput(
          screenX,
          screenY
        );
        textElement.text = textarea.value;
        this.scene.updateElement(textElement);
      }
      document.body.removeChild(textarea);
    });
  }

  private handleDoubleClick = (event: MouseEvent) => {

    const point = this.camera.screenToWorld({x:event.clientX, y: event.clientY});

    // Check if we clicked on an existing text element
    const element = this.elementManager.findElementAtPoint(point);
    if (element?.type === "text") {
      this.drawingManager.editExistingText(
        element,
        event.clientX,
        event.clientY
      );
    } else if (this.state.currentTool === "text") {
      this.drawingManager.createTextInputField(
        point,
        event.clientX,
        event.clientY
      );
    }
  };

  public setupEventListeners() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener("dblclick", this.handleDoubleClick);
  }

  public setupSceneListener() {
    // Listen for changes in the scene (e.g., when elements are added, updated, or deleted)
    this.scene.addUpdateListener((elements: ExcalidrawElement[]) => {
      // Re-render the canvas whenever the scene changes
      this.renderer.isDirty = true;
      this.renderer.render(this.scene.getElements());

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

  destroy() {
    this.shouldRender = false;
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
    this.canvas.removeEventListener("mouseleave", this.handleMouseLeave);

    if (this.eraserManager.eraserCursor) {
      document.body.removeChild(this.eraserManager.eraserCursor);
      this.eraserManager.eraserCursor = null;
    }
    this.camera.cleanup();
  }
}