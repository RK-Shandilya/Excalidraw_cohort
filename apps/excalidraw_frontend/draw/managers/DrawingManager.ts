import { Camera } from "../Camera";
import { AppState, ExcalidrawElement, Point } from "../types/types";
import { Renderer } from "./RenderManager";
import { Scene } from "./SceneManager";

export class DrawingManager {
  private scene: Scene;
  private state: AppState;
  private camera: Camera;
  private renderer: Renderer

  constructor(scene: Scene, state: AppState, camera: Camera, renderer: Renderer) {
    this.scene = scene;
    this.state = state;
    this.camera = camera;
    this.renderer = renderer;
  }

  public startFreeDraw(point: Point) {
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
    this.scene.addElement(element);
    return element;
  }

  // In DrawingManager.ts
  public startTextInput(screenX: number, screenY: number): ExcalidrawElement {
    const element: ExcalidrawElement = {
      id: crypto.randomUUID(),
      type: "text",
      x: this.camera.screenToWorld({ x: screenX, y: screenY }).x,
      y: this.camera.screenToWorld({ x: screenX, y: screenY }).y,
      width: 0,
      height: 0,
      text: "",
      strokeColor: "#000000",
      fontSize: 20,
      fontFamily: "Arial",
      angle: 0, 
      backgroundColor: "#ffffff", 
      fillStyle: 'solid', 
      strokeWidth: 2, 
      opacity: 1
    };
    this.scene.addElement(element);
    return element;
  }

  // Add an update listener mechanism
  public updateListeners: ((drawingState: { isDrawing: boolean; drawingShapeType: string | null }) => void)[] = [];

  public addUpdateListener(callback: (drawingState: { isDrawing: boolean; drawingShapeType: string | null }) => void) {
    this.updateListeners.push(callback);
  }

  public notifyUpdateListeners(drawingState: { isDrawing: boolean; drawingShapeType: string | null }) {
    this.updateListeners.forEach(listener => listener(drawingState));
  }

  public startDrawingShape(point: Point, type: "rect" | "circle" | "line" | "arrow") {
    const element: ExcalidrawElement = {
      id: crypto.randomUUID(),
      type, 
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
    return element;
  }

  public createInputElement(screenX: number, screenY: number): HTMLTextAreaElement {
    const textarea = document.createElement("textarea");
    const style = textarea.style;

    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    
    style.position = "fixed";
    style.left = `${screenX + scrollX}px`;
    style.top = `${screenY + scrollY}px`;

    const zoom = this.camera.getViewport().zoom;
    style.transform = `scale(${zoom})`;
    style.transformOrigin = "left top";

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

    textarea.addEventListener("input", () => {
      style.height = "auto";
      style.width = "auto";
      style.height = `${textarea.scrollHeight}px`;
      style.width = `${textarea.scrollWidth}px`;
    });

    return textarea;
  }

  public editExistingText(element: ExcalidrawElement, screenX: number, screenY: number) {
    const input = this.createInputElement(screenX, screenY);
    input.value = element.text || "";
    
    const originalElement = { ...element };
    let isDeleting = false;
    
    input.onblur = () => {
      if (isDeleting) return;
      
      const newText = input.value.trim();
      if (newText && newText !== originalElement.text) {
        this.scene.updateElement({
          ...element,
          text: newText,
        });
      } else if (!newText) {
        this.scene.deleteElement(element.id);
      }
      
      document.body.removeChild(input);
      this.renderer.render(this.scene.getElements());
    };
    
    input.onkeydown = (e) => {
      if (e.key === "Escape") {
        isDeleting = true;
        input.blur();
      }
    };
  }

  public createTextInputField(
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
        this.renderer.render(this.scene.getElements());
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
}