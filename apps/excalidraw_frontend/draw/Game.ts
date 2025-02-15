import { EventManager } from './managers/EventManager';
import { AppStateManager } from './managers/StateManager';
import { DrawingManager } from './managers/DrawingManager';
import { Renderer } from './managers/RenderManager';
import { ElementManager } from './managers/ElementManager';
import { SelectionManager } from './managers/SelectionManager';
import { Scene } from './managers/SceneManager';
import { EraserTool } from './managers/EraserManager';

import { AppState, ExcalidrawElement, Point, Tool } from './types/types';
import { Camera } from './Camera';


export class Game {
  private renderManager: Renderer;
  private eventManager: EventManager;
  private stateManager: AppStateManager;
  private elementManager: ElementManager;
  private selectionManager: SelectionManager;
  private drawingManager: DrawingManager;
  private eraserManager: EraserTool;
  public scene: Scene;
  private socket: WebSocket;
  private roomId: string;
  private state: AppState;
  private camera: Camera;

  private eraserPath: Point[] = [];
  private eraserElement: ExcalidrawElement | null = null;
  private eraserCursor: HTMLDivElement | null = null;
  private ERASER_SIZE: number = 20;

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.scene = new Scene();
    this.socket = socket;
    this.roomId = roomId;
  
    this.state = {
      currentTool: "selection",
      draggingElement: null,
      selectedElements: [],
      isResizing: false,
      isRotating: false,
      isPanning: false,
      startBoundingBox: null,
      isDrawing: false
    };
  
    // Initialize managers
    this.elementManager = new ElementManager(this.scene, this.ERASER_SIZE);
    this.stateManager = new AppStateManager();
    this.camera = new Camera(canvas, this.stateManager, this.scene);
    this.selectionManager = new SelectionManager(
      this.camera,
      this.scene,
      this.elementManager,
      this.stateManager,
    );
    this.renderManager = new Renderer(canvas, this.camera, this.selectionManager);
    this.drawingManager = new DrawingManager(
      this.scene,
      this.state,
      this.camera,
      this.renderManager
    );
    this.eraserManager = new EraserTool(
      this.scene,
      this.eraserPath,
      this.eraserElement,
      this.eraserCursor,
      this.ERASER_SIZE
    );
  
    // Set up the camera's renderer
    this.camera.setRenderer(this.renderManager);
  
    // Add scene update listener
    this.scene.addUpdateListener((elements) => {
      this.render();
    });
  
    // Initialize event manager
    this.eventManager = new EventManager(
      canvas,
      this.renderManager,
      this.scene,
      this.camera,
      this.state,
      this.drawingManager,
      this.selectionManager,
      this.eraserManager,
      this.elementManager,
      this.stateManager,
      this.socket,
      this.roomId
    );
  
    // Set up event listeners
    this.eventManager.setupEventListeners();
    this.eventManager.setupSceneListener();
  }

  // Delegated methods
  public setTool(tool: Tool) {
    this.stateManager.setTool(tool);
  }

  public setElements(elements: ExcalidrawElement[]) {
    elements.forEach(element => this.scene.addElement(element));
  }

  public destroy() {
    this.eventManager.destroy();
  }

  clearSelection() {
    this.selectionManager.clearSelection()
  }

  render() {
    this.renderManager.isDirty = true;
    this.renderManager.render(this.scene.getElements());
  }
  
  onSelectionChange(callback: any){
    this.selectionManager.onSelectionChange(callback);
  }

  public renderSelectionBox(element:ExcalidrawElement){
    const element1 = this.selectionManager.renderSelectionBox(element);
    return element1
  }

  onElementUpdate(callback: any) {
    this.selectionManager.onElementUpdate(callback)
  }

  isClickingElement(e: MouseEvent){
    const point = this.camera.screenToWorld({ x: e.offsetX, y: e.offsetY });
    const clickedElement = this.elementManager.findElementAtPoint(point);
    return clickedElement !== null;
  }

  public getCamera(): Camera {
    return this.camera;
  }
  
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
  public resetCamera() {
    this.camera.resetViewport();
    this.render();
  }

  private updateSelectedElements(props: Partial<ExcalidrawElement>) {
    this.state.selectedElements.forEach((element) => {
      const updatedElement = { ...element, ...props };
      this.scene.updateElement(updatedElement);
    });
    this.render();
  }

  public setPanning(isPanning: boolean) {

    this.stateManager.setPanning(isPanning);
  }
}