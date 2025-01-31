import type { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";
import { Camera } from "@/draw/Camera";

type Shape = {
  id: string;
  rotation: number;
  selected: boolean;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  strokeStyle: string;
  locked: boolean;
  groupId?: string;
  edges?: string;
  sloppiness?: number;
} & (
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      cornerRadius?: number;
    }
  | {
      type: "circle";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    }
  | {
      type: "pencil";
      points: { x: number; y: number }[];
      smoothing: number;
    }
  | {
      type: "line";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      arrowStart?: boolean;
      arrowEnd?: boolean;
    }
  | {
      type: "text";
      x: number;
      y: number;
      text: string;
      fontSize: number;
      fontFamily: string;
      textAlign: CanvasTextAlign;
      bold: boolean;
      italic: boolean;
    }
);

type ResizeHandle = {
  position: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
  x: number;
  y: number;
};

type SelectionState = {
  selectedShapeIds: Set<string>;
  isDragging: boolean;
  isResizing: boolean;
  isRotating: boolean;
  dragStartX: number;
  dragStartY: number;
  resizeHandle: ResizeHandle | null;
  rotationAngle: number;
  selectionBox: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null;
  rotationCenter: { x: number; y: number } | null;
  initialShapes: { [key: string]: Shape };
};

const ROTATION_HANDLE_DISTANCE = 90;

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private existingShapes: Shape[];
  private roomId: string;
  private clicked: boolean;
  private startX = 0;
  private startY = 0;
  private currentPencilPoints: { x: number; y: number }[] = [];
  private selectedTool: Tool = "circle";
  private lineThickness = 2;
  private socket: WebSocket;
  private selectionState: SelectionState = {
    selectedShapeIds: new Set(),
    isDragging: false,
    isResizing: false,
    isRotating: false,
    dragStartX: 0,
    dragStartY: 0,
    resizeHandle: null,
    rotationAngle: 0,
    selectionBox: null,
    rotationCenter: null,
    initialShapes: {},
  };

  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  private gridSize = 20;
  private snapToGrid = true;

  private undoStack: Shape[][] = [];
  private redoStack: Shape[][] = [];

  private groups: Map<string, Set<string>> = new Map();
  private currentStrokeColor: string = "#ffffff";
  private currentFillColor: string = "transparent";
  private currentStrokeWidth: number = 1.5;
  private currentOpacity: number = 1;
  private currentStrokeStyle: string = "solid";
  private currentSloppiness: number = 0;
  private currentEdges: string = "sharp";
  private currentArrowEnd: boolean = false;

  private textInput: HTMLInputElement | null = null;
  private currentText: string = "Text";
  private currentFontSize: number = 20;
  private currentFontFamily: string = "Arial";
  private currentTextAlign: CanvasTextAlign = "left";
  private currentBold: boolean = false;
  private currentItalic: boolean = false;
  private smoothingEnabled: boolean = true;
  private smoothingLevel: number = 0.5;
  private isShiftPressed: boolean = false;
  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.existingShapes = [];
    this.roomId = roomId;
    this.camera = new Camera(canvas);
    this.socket = socket;
    this.clicked = false;
    this.init();
    this.setupCanvas();
    this.initHandlers();
    this.initMouseHandlers();
  }

  private setupCanvas = () => {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  };

  initHandlers() {
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "chat") {
        const parsedData = JSON.parse(message.message);

        if (parsedData.action === "delete") {
          this.existingShapes = this.existingShapes.filter(
            (shape) => !parsedData.shapeIds.includes(shape.id)
          );
        } else if (parsedData.shape) {
          const existingIndex = this.existingShapes.findIndex(
            (shape) => shape.id === parsedData.shape.id
          );

          if (existingIndex !== -1) {
            this.existingShapes[existingIndex] = parsedData.shape;
          } else {
            this.existingShapes.push(parsedData.shape);
          }
        }

        this.clearCanvas();
      }
    };

    window.addEventListener("keydown", this.keyDownHandler);
  }

  private keyDownHandler = (e: KeyboardEvent) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      if (this.selectionState.selectedShapeIds.size > 0) {
        this.existingShapes = this.existingShapes.filter(
          (shape) => !this.selectionState.selectedShapeIds.has(shape.id)
        );
        this.selectionState.selectedShapeIds.clear();
        this.clearCanvas();
        this.socket.send(
          JSON.stringify({
            type: "chat",
            message: JSON.stringify({
              action: "delete",
              shapeIds: Array.from(this.selectionState.selectedShapeIds),
            }),
            roomId: this.roomId,
          })
        );
      }
    }

    if (e.ctrlKey && e.key === "c") {
      this.copySelectedShapes();
    }

    if (e.ctrlKey && e.key === "v") {
      this.pasteShapes();
    }

    if (e.ctrlKey && e.key === "a") {
      e.preventDefault();
      this.selectAllShapes();
    }

    if (e.ctrlKey && e.key === "z") {
      this.undo();
    }

    if (e.ctrlKey && e.key === "y") {
      this.redo();
    }

    if (e.ctrlKey && e.key === "g") {
      this.groupSelectedShapes();
    }

    if (e.key === "Escape") {
      this.selectionState.selectedShapeIds.clear();
      this.clearCanvas();
    }
  };

  public setStrokeColor(color: string) {
    this.currentStrokeColor = color;
    this.updateSelectedShapes({ strokeColor: color });
  }

  public setFillColor(color: string) {
    this.currentFillColor = color;
    this.updateSelectedShapes({ fillColor: color });
  }

  public setStrokeWidth(width: number) {
    this.currentStrokeWidth = width;
    this.updateSelectedShapes({ strokeWidth: width });
  }

  public setOpacity(opacity: number) {
    this.currentOpacity = opacity;
    this.updateSelectedShapes({ opacity });
  }

  public setStrokeStyle(style: string) {
    this.currentStrokeStyle = style;
    this.updateSelectedShapes({ strokeStyle: style });
  }

  public setSloppiness(level: number) {
    this.currentSloppiness = level;
    this.updateSelectedShapes({ sloppiness: level });
  }

  public setEdges(edges: string) {
    this.currentEdges = edges;
    this.updateSelectedShapes({ edges });
  }

  private updateSelectedShapes(properties: {
    strokeColor?: string;
    fillColor?: string;
    strokeWidth?: number;
    opacity?: number;
    strokeStyle?: string;
    sloppiness?: number;
    edges?: string;
  }) {
    if (this.selectionState.selectedShapeIds.size > 0) {
      this.existingShapes = this.existingShapes.map((shape) => {
        if (this.selectionState.selectedShapeIds.has(shape.id)) {
          return { ...shape, ...properties };
        }
        return shape;
      });
      this.clearCanvas();
      this.emitShapeUpdates();
    }
  }

  private handleTextInput = (e: MouseEvent) => {
    const x = e.pageX - this.canvas.offsetLeft;
    const y = e.pageY - this.canvas.offsetTop;

    if (this.selectedTool === "text") {
      if (this.textInput) {
        this.textInput.remove();
        this.textInput = null;
      }

      this.textInput = document.createElement("input");
      this.textInput.type = "text";
      this.textInput.style.position = "absolute";
      this.textInput.style.left = `${x}px`;
      this.textInput.style.top = `${y}px`;
      this.textInput.style.fontSize = `${this.currentFontSize}px`;
      this.textInput.style.fontFamily = this.currentFontFamily;
      this.textInput.style.color = this.currentStrokeColor;
      this.textInput.style.background = "transparent";
      this.textInput.style.border = "none";
      this.textInput.style.outline = "none";
      this.textInput.value = this.currentText || "Text";

      this.canvas.parentElement?.appendChild(this.textInput);
      this.textInput.focus();

      this.textInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const newText = this.textInput?.value || "Text";
          const newShape: Shape = {
            id: crypto.randomUUID(),
            type: "text",
            x,
            y,
            text: newText,
            fontSize: this.currentFontSize,
            fontFamily: this.currentFontFamily,
            textAlign: this.currentTextAlign,
            bold: this.currentBold,
            italic: this.currentItalic,
            rotation: 0,
            selected: false,
            strokeColor: this.currentStrokeColor,
            fillColor: "transparent",
            strokeWidth: this.lineThickness,
            opacity: 1,
            strokeStyle: this.currentStrokeStyle,
            locked: false,
          };
          this.existingShapes.push(newShape);
          this.clearCanvas();
          this.emitShapeUpdates();

          this.textInput?.remove();
          this.textInput = null;
        }
      });

      this.textInput.addEventListener("blur", () => {
        this.textInput?.remove();
        this.textInput = null;
      });
    }
  };

  groupSelectedShapes() {
    if (this.selectionState.selectedShapeIds.size < 2) return;

    const groupId = crypto.randomUUID();
    const selectedShapes = Array.from(this.selectionState.selectedShapeIds);

    this.groups.set(groupId, new Set(selectedShapes));

    this.existingShapes = this.existingShapes.map((shape) => {
      if (selectedShapes.includes(shape.id)) {
        return { ...shape, groupId };
      }
      return shape;
    });

    this.clearCanvas();
  }

  ungroup() {
    const selectedShapes = this.existingShapes.filter((shape) =>
      this.selectionState.selectedShapeIds.has(shape.id)
    );

    const groupIds = new Set(
      selectedShapes.map((shape) => shape.groupId).filter(Boolean)
    );

    groupIds.forEach((groupId) => {
      if (groupId) {
        this.groups.delete(groupId);
        this.existingShapes = this.existingShapes.map((shape) => {
          if (shape.groupId === groupId) {
            const { groupId: _, ...rest } = shape;
            return rest;
          }
          return shape;
        });
      }
    });

    this.clearCanvas();
  }

  mouseLeaveHandler = () => {
    this.clicked = false;
    this.currentPencilPoints = [];

    if (
      this.selectionState.isDragging ||
      this.selectionState.isResizing ||
      this.selectionState.isRotating
    ) {
      this.emitShapeUpdates();
    }

    this.selectionState.isDragging = false;
    this.selectionState.isResizing = false;
    this.selectionState.isRotating = false;
    this.selectionState.resizeHandle = null;
    this.selectionState.rotationCenter = null;
    this.selectionState.initialShapes = {};

    this.clearCanvas();
  };

  toggleLock(shapeIds: string[]) {
    this.existingShapes = this.existingShapes.map((shape) => {
      if (shapeIds.includes(shape.id)) {
        return { ...shape, locked: !shape.locked };
      }
      return shape;
    });
    this.clearCanvas();
  }

  alignShapes(
    alignment: "left" | "center" | "right" | "top" | "middle" | "bottom"
  ) {
    if (this.selectionState.selectedShapeIds.size < 2) return;

    const selectedShapes = this.existingShapes.filter((shape) =>
      this.selectionState.selectedShapeIds.has(shape.id)
    );

    const bounds = this.getSelectionBounds(selectedShapes);

    selectedShapes.forEach((shape) => {
      const shapeBounds = this.getShapeBounds(shape);
      let dx = 0;
      let dy = 0;

      switch (alignment) {
        case "left":
          dx = bounds.x - shapeBounds.x;
          break;
        case "center":
          dx =
            bounds.x +
            bounds.width / 2 -
            (shapeBounds.x + shapeBounds.width / 2);
          break;
        case "right":
          dx = bounds.x + bounds.width - (shapeBounds.x + shapeBounds.width);
          break;
        case "top":
          dy = bounds.y - shapeBounds.y;
          break;
        case "middle":
          dy =
            bounds.y +
            bounds.height / 2 -
            (shapeBounds.y + shapeBounds.height / 2);
          break;
        case "bottom":
          dy = bounds.y + bounds.height - (shapeBounds.y + shapeBounds.height);
          break;
      }

      this.moveShape(shape, dx, dy);
    });

    this.clearCanvas();
    this.emitShapeUpdates();
  }

  distributeShapes(direction: "horizontal" | "vertical") {
    if (this.selectionState.selectedShapeIds.size < 3) return;

    const selectedShapes = this.existingShapes
      .filter((shape) => this.selectionState.selectedShapeIds.has(shape.id))
      .sort((a, b) => {
        const boundsA = this.getShapeBounds(a);
        const boundsB = this.getShapeBounds(b);
        return direction === "horizontal"
          ? boundsA.x - boundsB.x
          : boundsA.y - boundsB.y;
      });

    const firstShape = selectedShapes[0];
    const lastShape = selectedShapes[selectedShapes.length - 1];
    const firstBounds = this.getShapeBounds(firstShape);
    const lastBounds = this.getShapeBounds(lastShape);

    const totalSpace =
      direction === "horizontal"
        ? lastBounds.x - (firstBounds.x + firstBounds.width)
        : lastBounds.y - (firstBounds.y + firstBounds.height);

    const spacing = totalSpace / (selectedShapes.length - 1);

    selectedShapes.slice(1, -1).forEach((shape, index) => {
      const shapeBounds = this.getShapeBounds(shape);
      const targetPosition =
        direction === "horizontal"
          ? firstBounds.x + firstBounds.width + spacing * (index + 1)
          : firstBounds.y + firstBounds.height + spacing * (index + 1);

      const currentPosition =
        direction === "horizontal" ? shapeBounds.x : shapeBounds.y;

      const delta = targetPosition - currentPosition;
      this.moveShape(
        shape,
        direction === "horizontal" ? delta : 0,
        direction === "horizontal" ? 0 : delta
      );
    });

    this.clearCanvas();
    this.emitShapeUpdates();
  }

  public destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.removeEventListener("mouseleave", this.mouseLeaveHandler);
    this.camera.cleanup();
    window.removeEventListener("resize", this.setupCanvas);
    window.removeEventListener("keydown", this.keyDownHandler);
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }
    this.existingShapes = [];
    this.selectionState = {
      selectedShapeIds: new Set(),
      isDragging: false,
      isResizing: false,
      isRotating: false,
      dragStartX: 0,
      dragStartY: 0,
      resizeHandle: null,
      rotationAngle: 0,
      selectionBox: null,
      rotationCenter: null,
      initialShapes: {},
    };
    this.clicked = false;
    this.currentPencilPoints = [];
    this.clearCanvas();
  }

  private copiedShapes: Shape[] = [];

  private pasteShapes() {
    if (this.copiedShapes.length === 0) return;
    this.selectionState.selectedShapeIds.clear();
    const offset = 20;
    const pastedShapes = this.copiedShapes.map((shape) => {
      const newShape = { ...shape, id: crypto.randomUUID() };
      this.moveShape(newShape, offset, offset);
      this.selectionState.selectedShapeIds.add(newShape.id);
      return newShape;
    });
    this.existingShapes.push(...pastedShapes);
    this.clearCanvas();
    pastedShapes.forEach((shape) => {
      this.socket.send(
        JSON.stringify({
          type: "chat",
          message: JSON.stringify({ shape }),
          roomId: this.roomId,
        })
      );
    });
  }

  private copySelectedShapes() {
    this.copiedShapes = this.existingShapes
      .filter((shape) => this.selectionState.selectedShapeIds.has(shape.id))
      .map((shape) => ({
        ...shape,
        id: crypto.randomUUID(),
      }));
  }

  private selectAllShapes() {
    this.existingShapes.forEach((shape) => {
      this.selectionState.selectedShapeIds.add(shape.id);
    });
    this.clearCanvas();
  }

  private initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.addEventListener("dblclick", this.handleDoubleClick);
    this.canvas.addEventListener("click", this.handleTextInput);
    this.canvas.addEventListener("mouseleave", () => {
      this.clicked = false;
      this.currentPencilPoints = [];
    });
  }

  private drawSelectionBox() {
    if (!this.selectionState.selectionBox) return;
    const { startX, startY, endX, endY } = this.selectionState.selectionBox;
    this.ctx.save();
    this.ctx.strokeStyle = "#0096fd";
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(
      Math.min(startX, endX),
      Math.min(startY, endY),
      Math.abs(endX - startX),
      Math.abs(endY - startY)
    );
    this.ctx.restore();
  }

  private applyRotationToPoint(
    point: { x: number; y: number },
    center: { x: number; y: number },
    angle: number
  ) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: cos * (point.x - center.x) + sin * (point.y - center.y) + center.x,
      y: -sin * (point.x - center.x) + cos * (point.y - center.y) + center.y,
    };
  }

  public rotateSelectedShapes(angle: number) {
    if (this.selectionState.selectedShapeIds.size === 0) return;

    const selectedShapes = this.existingShapes.filter((shape) =>
      this.selectionState.selectedShapeIds.has(shape.id)
    );

    const bounds = this.getSelectionBounds(selectedShapes);
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    selectedShapes.forEach((shape) => {
      shape.rotation = (shape.rotation + angle) % (Math.PI * 2);
    });

    this.clearCanvas();
    this.emitShapeUpdates();
  }

  private drawRotatedShape(shape: Shape) {
    this.ctx.save();
    const bounds = this.getShapeBounds(shape);
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(shape.rotation);
    this.ctx.translate(-centerX, -centerY);

    this.drawShape(shape);

    if (this.selectionState.selectedShapeIds.has(shape.id)) {
      const handleDistance = Math.max(bounds.width, bounds.height) / 2 + 30;
      const handleX = centerX;
      const handleY = centerY - handleDistance;

      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.lineTo(handleX, handleY);
      this.ctx.strokeStyle = "#0096fd";
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.arc(handleX, handleY, 5, 0, Math.PI * 2);
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fill();
      this.ctx.strokeStyle = "#0096fd";
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private drawShape(shape: Shape) {
    this.ctx.globalAlpha = shape.opacity;
    this.ctx.strokeStyle = shape.strokeColor || "#ffffff";
    this.ctx.fillStyle = shape.fillColor || "transparent";
    this.ctx.lineWidth = shape.strokeWidth;

    if (shape.strokeStyle === "dashed") {
      this.ctx.setLineDash([10, 5]);
    } else if (shape.strokeStyle === "dotted") {
      this.ctx.setLineDash([2, 5]);
    } else {
      this.ctx.setLineDash([]);
    }

    switch (shape.type) {
      case "rect":
        this.ctx.beginPath();
        this.ctx.roundRect(
          shape.x,
          shape.y,
          shape.width,
          shape.height,
          shape.cornerRadius || 0
        );
        this.ctx.stroke();
        if (shape.fillColor !== "transparent") {
          this.ctx.fill();
        }
        break;

      case "circle":
        this.ctx.beginPath();
        const centerX = (shape.startX + shape.endX) / 2;
        const centerY = (shape.startY + shape.endY) / 2;
        const radiusX = Math.abs(shape.endX - shape.startX) / 2;
        const radiusY = Math.abs(shape.endY - shape.startY) / 2;
        const radius = Math.max(radiusX, radiusY);
        this.ctx.ellipse(centerX, centerY, radius, radius, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        if (shape.fillColor !== "transparent") {
          this.ctx.fill();
        }
        break;

      case "line":
        this.ctx.beginPath();
        this.ctx.moveTo(shape.startX, shape.startY);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();
        break;

      case "pencil":
        if (shape.points.length > 1) {
          this.ctx.beginPath();
          this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
          shape.points.slice(1).forEach((point) => {
            this.ctx.lineTo(point.x, point.y);
          });
          this.ctx.stroke();
        }
        break;

      case "text":
        this.ctx.font = `${shape.bold ? "bold" : ""} ${shape.italic ? "italic" : ""} ${shape.fontSize}px ${shape.fontFamily}`;
        this.ctx.textAlign = shape.textAlign;
        this.ctx.fillStyle = shape.strokeColor || "#ffffff";
        this.ctx.fillText(shape.text, shape.x, shape.y);
        break;
    }
    this.ctx.globalAlpha = 1;
  }

  private init() {
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.fillStyle = "#000000";
    this.ctx.lineWidth = this.lineThickness;
    this.clearCanvas();
    getExistingShapes(this.roomId).then((shapes) => {
      this.existingShapes = shapes;
      this.clearCanvas();
    });
  }

  private clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.lineWidth = this.lineThickness;
    this.existingShapes.forEach((shape) => this.drawRotatedShape(shape));
    if (this.selectionState.selectedShapeIds.size > 0) {
      this.drawSelectionOverlay();
    }
    if (this.selectionState.selectionBox) {
      this.drawSelectionBox();
    }
  }

  mouseDownHandler = (e: MouseEvent) => {
    const x = e.pageX - this.canvas.offsetLeft;
    const y = e.pageY - this.canvas.offsetTop;

    if (this.selectedTool === "pan") {
      this.isPanning = true;
      this.panStartX = x;
      this.panStartY = y;
      return;
    }

    if (this.selectedTool === "selection") {
      const selectedIndex = this.findSelectedShape(x, y);
      const selectedShape =
        selectedIndex !== -1 ? this.existingShapes[selectedIndex] : null;

      if (selectedShape) {
        const bounds = this.getShapeBounds(selectedShape);
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        const rotationHandleY = centerY - ROTATION_HANDLE_DISTANCE;

        if (
          Math.abs(x - centerX) < 10 &&
          Math.abs(y - rotationHandleY) < 10 &&
          this.selectionState.selectedShapeIds.has(selectedShape.id)
        ) {
          this.startRotation(x, y);
          return;
        }

        if (e.shiftKey) {
          if (this.selectionState.selectedShapeIds.has(selectedShape.id)) {
            this.selectionState.selectedShapeIds.delete(selectedShape.id);
          } else {
            this.selectionState.selectedShapeIds.add(selectedShape.id);
          }
        } else {
          if (!this.selectionState.selectedShapeIds.has(selectedShape.id)) {
            this.selectionState.selectedShapeIds.clear();
            this.selectionState.selectedShapeIds.add(selectedShape.id);
          }
        }

        const resizeHandle = this.isPointInResizeHandle(x, y);
        if (resizeHandle) {
          this.selectionState.isResizing = true;
          this.selectionState.resizeHandle = resizeHandle;
        } else {
          this.selectionState.isDragging = true;
        }

        this.selectionState.selectedShapeIds.forEach((id) => {
          const shape = this.existingShapes.find((s) => s.id === id);
          if (shape) {
            this.selectionState.initialShapes[id] = { ...shape };
          }
        });
      } else {
        if (!e.shiftKey) {
          this.selectionState.selectedShapeIds.clear();
        }
        this.selectionState.selectionBox = {
          startX: x,
          startY: y,
          endX: x,
          endY: y,
        };
      }

      this.selectionState.dragStartX = x;
      this.selectionState.dragStartY = y;
      this.clearCanvas();
      return;
    }

    this.clicked = true;
    this.startX = x;
    this.startY = y;

    if (this.selectedTool === "pencil") {
      this.currentPencilPoints = [{ x: this.startX, y: this.startY }];
    }
  };

  public setTool(tool: Tool) {
    this.selectedTool = tool;
  }

  private getSelectionBounds(shapes: Shape[]): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    if (shapes.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const bounds = shapes.map((shape) => this.getShapeBounds(shape));
    const minX = Math.min(...bounds.map((b) => b.x));
    const minY = Math.min(...bounds.map((b) => b.y));
    const maxX = Math.max(...bounds.map((b) => b.x + b.width));
    const maxY = Math.max(...bounds.map((b) => b.y + b.height));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private isPointInResizeHandle(x: number, y: number): ResizeHandle | null {
    if (this.selectionState.selectedShapeIds.size === 0) return null;

    const selectedShapes = this.existingShapes.filter((shape) =>
      this.selectionState.selectedShapeIds.has(shape.id)
    );
    const bounds = this.getSelectionBounds(selectedShapes);
    const handleSize = 8;
    const halfHandle = handleSize / 2;

    const handles: ResizeHandle[] = [
      { position: "topLeft", x: bounds.x, y: bounds.y },
      { position: "topRight", x: bounds.x + bounds.width, y: bounds.y },
      {
        position: "bottomRight",
        x: bounds.x + bounds.width,
        y: bounds.y + bounds.height,
      },
      { position: "bottomLeft", x: bounds.x, y: bounds.y + bounds.height },
    ];

    return (
      handles.find(
        (handle) =>
          x >= handle.x - halfHandle &&
          x <= handle.x + halfHandle &&
          y >= handle.y - halfHandle &&
          y <= handle.y + halfHandle
      ) || null
    );
  }

  private handleDoubleClick = (e: MouseEvent) => {
    const x = e.pageX - this.canvas.offsetLeft;
    const y = e.pageY - this.canvas.offsetTop;

    const selectedIndex = this.findSelectedShape(x, y);
    const selectedShape =
      selectedIndex !== -1 ? this.existingShapes[selectedIndex] : null;

    if (selectedShape && selectedShape.type === "text") {
      const newText = prompt("Edit text:", selectedShape.text);
      if (newText !== null) {
        selectedShape.text = newText;
        this.clearCanvas();
        this.emitShapeUpdates();
      }
    }
  };

  private resizeShape(
    shape: Shape,
    dx: number,
    dy: number,
    handle: ResizeHandle["position"],
    maintainAspectRatio: boolean
  ) {
    const bounds = this.getShapeBounds(shape);
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    const cos = Math.cos(-shape.rotation);
    const sin = Math.sin(-shape.rotation);
    const rotatedDx = cos * dx - sin * dy;
    const rotatedDy = sin * dx + cos * dy;

    let newWidth = bounds.width;
    let newHeight = bounds.height;
    let newX = bounds.x;
    let newY = bounds.y;

    switch (handle) {
      case "topLeft":
        newWidth -= rotatedDx;
        newHeight -= rotatedDy;
        newX += rotatedDx;
        newY += rotatedDy;
        break;
      case "topRight":
        newWidth += rotatedDx;
        newHeight -= rotatedDy;
        newY += rotatedDy;
        break;
      case "bottomRight":
        newWidth += rotatedDx;
        newHeight += rotatedDy;
        break;
      case "bottomLeft":
        newWidth -= rotatedDx;
        newHeight += rotatedDy;
        newX += rotatedDx;
        break;
    }

    if (maintainAspectRatio) {
      const aspectRatio = bounds.width / bounds.height;
      if (Math.abs(newWidth) / Math.abs(newHeight) > aspectRatio) {
        newWidth = Math.sign(newWidth) * Math.abs(newHeight * aspectRatio);
      } else {
        newHeight = Math.sign(newHeight) * Math.abs(newWidth / aspectRatio);
      }
    }

    this.applyResizedDimensions(shape, newX, newY, newWidth, newHeight);
  }

  private applyResizedDimensions(
    shape: Shape,
    newX: number,
    newY: number,
    newWidth: number,
    newHeight: number
  ) {
    switch (shape.type) {
      case "rect":
        shape.x = newX;
        shape.y = newY;
        shape.width = Math.abs(newWidth);
        shape.height = Math.abs(newHeight);
        break;
      case "circle": {
        const radius = Math.max(Math.abs(newWidth), Math.abs(newHeight)) / 2;
        shape.startX = newX;
        shape.startY = newY;
        shape.endX = newX + radius * 2;
        shape.endY = newY + radius * 2;
        break;
      }
      case "line":
        const angle = Math.atan2(
          shape.endY - shape.startY,
          shape.endX - shape.startX
        );
        const length = Math.sqrt(newWidth * newWidth + newHeight * newHeight);
        shape.startX = newX;
        shape.startY = newY;
        shape.endX = newX + length * Math.cos(angle);
        shape.endY = newY + length * Math.sin(angle);
        break;
      case "pencil": {
        const scaleX =
          newWidth /
          (shape.points[shape.points.length - 1].x - shape.points[0].x);
        const scaleY =
          newHeight /
          (shape.points[shape.points.length - 1].y - shape.points[0].y);
        const originX = shape.points[0].x;
        const originY = shape.points[0].y;

        shape.points = shape.points.map((point) => ({
          x: originX + (point.x - originX) * scaleX,
          y: originY + (point.y - originY) * scaleY,
        }));
        break;
      }
      case "text":
        shape.x = newX;
        shape.y = newY;
        shape.fontSize = Math.abs(newHeight);
        break;
    }
  }

  private rotatePoint(
    point: { x: number; y: number },
    center: { x: number; y: number },
    angle: number
  ) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: cos * (point.x - center.x) - sin * (point.y - center.y) + center.x,
      y: sin * (point.x - center.x) + cos * (point.y - center.y) + center.y,
    };
  }

  mouseMoveHandler = (e: MouseEvent) => {
    const x = e.pageX - this.canvas.offsetLeft;
    const y = e.pageY - this.canvas.offsetTop;

    if (this.isPanning) {
      const dx = x - this.panStartX;
      const dy = y - this.panStartY;
      this.camera.pan(dx, dy);
      this.panStartX = x;
      this.panStartY = y;
      this.clearCanvas();
      return;
    }

    if (this.selectedTool === "selection") {
      if (
        this.selectionState.isRotating &&
        this.selectionState.rotationCenter
      ) {
        this.handleRotation(x, y);
        return;
      }

      if (this.selectionState.isResizing && this.selectionState.resizeHandle) {
        const dx = x - this.selectionState.dragStartX;
        const dy = y - this.selectionState.dragStartY;

        this.existingShapes
          .filter((shape) => this.selectionState.selectedShapeIds.has(shape.id))
          .forEach((shape) => {
            this.resizeShape(
              shape,
              dx,
              dy,
              this.selectionState.resizeHandle!.position,
              e.shiftKey
            );
          });

        this.selectionState.dragStartX = x;
        this.selectionState.dragStartY = y;
        this.clearCanvas();
        return;
      }

      if (this.selectionState.isDragging) {
        const dx = x - this.selectionState.dragStartX;
        const dy = y - this.selectionState.dragStartY;

        this.existingShapes.forEach((shape) => {
          if (this.selectionState.selectedShapeIds.has(shape.id)) {
            this.moveShape(shape, dx, dy);
          }
        });

        this.selectionState.dragStartX = x;
        this.selectionState.dragStartY = y;
        this.clearCanvas();
        return;
      }

      if (this.selectionState.selectionBox) {
        this.selectionState.selectionBox.endX = x;
        this.selectionState.selectionBox.endY = y;
        this.clearCanvas();
        return;
      }
    }

    if (!this.clicked) return;

    this.clearCanvas();

    switch (this.selectedTool) {
      case "rect": {
        const width = x - this.startX;
        const height = y - this.startY;
        this.ctx.strokeRect(this.startX, this.startY, width, height);
        if (this.currentFillColor !== "transparent") {
          this.ctx.fillRect(this.startX, this.startY, width, height);
        }
        break;
      }
      case "circle": {
        const centerX = (this.startX + x) / 2;
        const centerY = (this.startY + y) / 2;
        const radiusX = Math.abs(x - this.startX) / 2;
        const radiusY = Math.abs(y - this.startY) / 2;
        const radius = Math.max(radiusX, radiusY);
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY, radius, radius, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        if (this.currentFillColor !== "transparent") {
          this.ctx.fill();
        }
        break;
      }
      case "line": {
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        break;
      }
      case "pencil": {
        this.currentPencilPoints.push({ x, y });
        if (this.currentPencilPoints.length > 1) {
          this.ctx.beginPath();
          this.ctx.moveTo(
            this.currentPencilPoints[0].x,
            this.currentPencilPoints[0].y
          );
          this.currentPencilPoints.slice(1).forEach((point) => {
            this.ctx.lineTo(point.x, point.y);
          });
          this.ctx.stroke();
        }
        break;
      }
      case "text": {
        this.ctx.font = `${this.currentBold ? "bold" : ""} ${this.currentItalic ? "italic" : ""} ${this.currentFontSize}px ${this.currentFontFamily}`;
        this.ctx.fillStyle = this.currentStrokeColor;
        this.ctx.fillText(this.currentText, x, y);
        break;
      }
    }
  };

  private moveShape(shape: Shape, dx: number, dy: number) {
    let adjustedDx = dx;
    let adjustedDy = dy;

    if (shape.rotation !== 0) {
      const cos = Math.cos(shape.rotation);
      const sin = Math.sin(shape.rotation);
      adjustedDx = cos * dx + sin * dy;
      adjustedDy = -sin * dx + cos * dy;
    }

    switch (shape.type) {
      case "rect":
        shape.x += adjustedDx;
        shape.y += adjustedDy;
        break;
      case "circle":
        shape.startX += adjustedDx;
        shape.startY += adjustedDy;
        shape.endX += adjustedDx;
        shape.endY += adjustedDy;
        break;
      case "line":
        shape.startX += adjustedDx;
        shape.startY += adjustedDy;
        shape.endX += adjustedDx;
        shape.endY += adjustedDy;
        break;
      case "pencil":
        shape.points = shape.points.map((point) => ({
          x: point.x + adjustedDx,
          y: point.y + adjustedDy,
        }));
        break;
      case "text":
        shape.x += adjustedDx;
        shape.y += adjustedDy;
        break;
    }
  }

  private handleRotation(x: number, y: number) {
    if (!this.selectionState.rotationCenter) return;

    const { x: centerX, y: centerY } = this.selectionState.rotationCenter;
    const angle = Math.atan2(y - centerY, x - centerX);
    const deltaAngle = angle - this.selectionState.rotationAngle;

    this.existingShapes
      .filter((shape) => this.selectionState.selectedShapeIds.has(shape.id))
      .forEach((shape) => {
        const initialShape = this.selectionState.initialShapes[shape.id];
        if (initialShape) {
          shape.rotation = (initialShape.rotation + deltaAngle) % (Math.PI * 2);
        }
      });

    this.selectionState.rotationAngle = angle;
    this.clearCanvas();

    if (this.selectionState.selectedShapeIds.size > 0) {
      this.drawSelectionOverlay();
    }
  }

  private findSelectedShape(x: number, y: number): number {
    for (let i = this.existingShapes.length - 1; i >= 0; i--) {
      const shape = this.existingShapes[i];
      if (this.isPointInRotatedShape(shape, x, y)) {
        return i;
      }
    }
    return -1;
  }

  private isPointInRotatedShape(shape: Shape, x: number, y: number): boolean {
    const bounds = this.getShapeBounds(shape);
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    let testPoint = { x, y };
    if (shape.rotation !== 0) {
      const cos = Math.cos(-shape.rotation);
      const sin = Math.sin(-shape.rotation);
      testPoint = {
        x: cos * (x - centerX) - sin * (y - centerY) + centerX,
        y: sin * (x - centerX) + cos * (y - centerY) + centerY,
      };
    }

    switch (shape.type) {
      case "rect": {
        const padding = 2;
        return (
          testPoint.x >= shape.x - padding &&
          testPoint.x <= shape.x + shape.width + padding &&
          testPoint.y >= shape.y - padding &&
          testPoint.y <= shape.y + shape.height + padding
        );
      }
      case "circle": {
        const radius =
          Math.max(
            Math.abs(shape.endX - shape.startX),
            Math.abs(shape.endY - shape.startY)
          ) / 2;
        const shapeCenterX = (shape.startX + shape.endX) / 2;
        const shapeCenterY = (shape.startY + shape.endY) / 2;
        const dx = testPoint.x - shapeCenterX;
        const dy = testPoint.y - shapeCenterY;
        const padding = 2;
        return Math.sqrt(dx * dx + dy * dy) <= radius + padding;
      }
      case "line": {
        const padding = 3;
        return (
          this.pointToLineDistance(
            testPoint.x,
            testPoint.y,
            shape.startX,
            shape.startY,
            shape.endX,
            shape.endY
          ) <= padding
        );
      }
      case "pencil": {
        const padding = 3;
        for (let i = 1; i < shape.points.length; i++) {
          const point1 = this.rotatePoint(
            shape.points[i - 1],
            { x: centerX, y: centerY },
            shape.rotation
          );
          const point2 = this.rotatePoint(
            shape.points[i],
            { x: centerX, y: centerY },
            shape.rotation
          );
          const dist = this.pointToLineDistance(
            testPoint.x,
            testPoint.y,
            point1.x,
            point1.y,
            point2.x,
            point2.y
          );
          if (dist <= padding) return true;
        }
        return false;
      }
      case "text": {
        const padding = 10;
        return (
          testPoint.x >= shape.x - padding &&
          testPoint.x <=
            shape.x + this.ctx.measureText(shape.text).width + padding &&
          testPoint.y >= shape.y - shape.fontSize - padding &&
          testPoint.y <= shape.y + padding
        );
      }
    }
  }

  private pointToLineDistance(
    x: number,
    y: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;

    return Math.sqrt(dx * dx + dy * dy);
  }

  mouseUpHandler = (e: MouseEvent) => {
    const x = e.pageX - this.canvas.offsetLeft;
    const y = e.pageY - this.canvas.offsetTop;

    if (this.isPanning) {
      this.isPanning = false;
      return;
    }

    if (this.selectedTool === "selection") {
      if (this.selectionState.isResizing) {
        this.selectionState.isResizing = false;
        this.selectionState.resizeHandle = null;
        this.emitShapeUpdates();
        this.selectionState.initialShapes = {};
        return;
      }

      if (this.selectionState.isDragging) {
        this.selectionState.isDragging = false;
        this.emitShapeUpdates();
        this.selectionState.initialShapes = {};
        return;
      }

      if (this.selectionState.isRotating) {
        this.selectionState.isRotating = false;
        this.selectionState.rotationCenter = null;
        this.emitShapeUpdates();
        this.selectionState.initialShapes = {};
        return;
      }

      if (this.selectionState.selectionBox) {
        const { startX, startY, endX, endY } = this.selectionState.selectionBox;
        const left = Math.min(startX, endX);
        const right = Math.max(startX, endX);
        const top = Math.min(startY, endY);
        const bottom = Math.max(startY, endY);

        this.existingShapes.forEach((shape) => {
          const bounds = this.getShapeBounds(shape);
          if (
            bounds.x >= left &&
            bounds.x + bounds.width <= right &&
            bounds.y >= top &&
            bounds.y + bounds.height <= bottom
          ) {
            this.selectionState.selectedShapeIds.add(shape.id);
          }
        });

        this.selectionState.selectionBox = null;
        this.clearCanvas();
      }
      return;
    }

    if (!this.clicked) return;
    this.clicked = false;

    const newShape: Shape = this.createShape(x, y);
    if (newShape) {
      this.existingShapes.push(newShape);
      this.emitShapeUpdates();
    }

    this.currentPencilPoints = [];
  };

  private emitShapeUpdates() {
    this.selectionState.selectedShapeIds.forEach((id) => {
      const shape = this.existingShapes.find((s) => s.id === id);
      if (shape) {
        this.socket.send(
          JSON.stringify({
            type: "chat",
            message: JSON.stringify({ shape }),
            roomId: this.roomId,
          })
        );
      }
    });
  }

  private createShape(x: number, y: number): Shape {
    const baseShape = {
      id: crypto.randomUUID(),
      rotation: 0,
      selected: false,
      strokeColor: this.currentStrokeColor || "#ffffff",
      fillColor: this.currentFillColor || "transparent",
      strokeWidth: this.lineThickness,
      opacity: 1,
      locked: false,
      strokeStyle: this.currentStrokeStyle,
      edges: this.currentEdges,
      sloppiness: this.currentSloppiness,
    };

    switch (this.selectedTool) {
      case "rect": {
        const width = x - this.startX;
        const height = y - this.startY;
        const normalizedX = width < 0 ? x : this.startX;
        const normalizedY = height < 0 ? y : this.startY;
        return {
          ...baseShape,
          type: "rect",
          x: normalizedX,
          y: normalizedY,
          width: Math.abs(width),
          height: Math.abs(height),
          cornerRadius: this.currentEdges === "rounded" ? 10 : 0,
        };
      }

      case "circle": {
        const centerX = (this.startX + x) / 2;
        const centerY = (this.startY + y) / 2;
        const radiusX = Math.abs(x - this.startX) / 2;
        const radiusY = Math.abs(y - this.startY) / 2;
        const radius = Math.max(radiusX, radiusY);

        return {
          ...baseShape,
          type: "circle",
          startX: centerX - radius,
          startY: centerY - radius,
          endX: centerX + radius,
          endY: centerY + radius,
        };
      }

      case "line": {
        let endX = x;
        let endY = y;

        if (this.isShiftPressed) {
          const dx = Math.abs(x - this.startX);
          const dy = Math.abs(y - this.startY);

          if (dx > dy) {
            endY = this.startY;
          } else {
            endX = this.startX;
          }
        }

        return {
          ...baseShape,
          type: "line",
          startX: this.startX,
          startY: this.startY,
          endX,
          endY,
          arrowStart: false,
          arrowEnd: this.currentArrowEnd || false,
        };
      }

      case "pencil": {
        if (this.currentPencilPoints.length < 2) {
          this.currentPencilPoints.push({ x: this.startX, y: this.startY });
        }

        let points = [...this.currentPencilPoints];
        if (this.smoothingEnabled && points.length > 2) {
          points = this.smoothPoints(points);
        }

        return {
          ...baseShape,
          type: "pencil",
          points,
          smoothing: this.currentSloppiness || 0.5,
        };
      }

      case "text": {
        const newText = prompt("Enter text:", this.currentText || "Text");
        if (newText === null)
          return {
            ...baseShape,
            type: "text",
            x,
            y,
            text: this.currentText || "Text",
            fontSize: this.currentFontSize || 20,
            fontFamily: this.currentFontFamily || "Arial",
            textAlign: this.currentTextAlign || "left",
            bold: this.currentBold || false,
            italic: this.currentItalic || false,
          };

        let finalX = this.startX;
        let finalY = this.startY;

        if (this.snapToGrid) {
          const snapped = this.snapToGridPoint(finalX, finalY);
          finalX = snapped.x;
          finalY = snapped.y;
        }

        return {
          ...baseShape,
          type: "text",
          x,
          y,
          text: newText,
          fontSize: this.currentFontSize || 20,
          fontFamily: this.currentFontFamily || "Arial",
          textAlign: this.currentTextAlign || "left",
          bold: this.currentBold || false,
          italic: this.currentItalic || false,
        };
      }

      default:
        throw new Error(`Invalid tool selected: ${this.selectedTool}`);
    }
  }

  private smoothPoints(
    points: { x: number; y: number }[]
  ): { x: number; y: number }[] {
    const smoothedPoints: { x: number; y: number }[] = [];
    const smoothingFactor = this.smoothingLevel || 0.5;

    smoothedPoints.push(points[0]);

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const current = points[i];
      const next = points[i + 1];

      const smoothedX =
        current.x * (1 - smoothingFactor) +
        ((prev.x + next.x) / 2) * smoothingFactor;
      const smoothedY =
        current.y * (1 - smoothingFactor) +
        ((prev.y + next.y) / 2) * smoothingFactor;

      smoothedPoints.push({ x: smoothedX, y: smoothedY });
    }

    smoothedPoints.push(points[points.length - 1]);

    return smoothedPoints;
  }

  public updateTextProperties(properties: {
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    textAlign?: CanvasTextAlign;
    bold?: boolean;
    italic?: boolean;
  }) {
    if (properties.text !== undefined) this.currentText = properties.text;
    if (properties.fontSize !== undefined)
      this.currentFontSize = properties.fontSize;
    if (properties.fontFamily !== undefined)
      this.currentFontFamily = properties.fontFamily;
    if (properties.textAlign !== undefined)
      this.currentTextAlign = properties.textAlign;
    if (properties.bold !== undefined) this.currentBold = properties.bold;
    if (properties.italic !== undefined) this.currentItalic = properties.italic;

    if (this.selectionState.selectedShapeIds.size > 0) {
      this.existingShapes = this.existingShapes.map((shape) => {
        if (
          this.selectionState.selectedShapeIds.has(shape.id) &&
          shape.type === "text"
        ) {
          return { ...shape, ...properties };
        }
        return shape;
      });
      this.clearCanvas();
      this.emitShapeUpdates();
    }
  }

  public updateShapeStyle(properties: {
    strokeColor?: string;
    fillColor?: string;
    strokeWidth?: number;
    arrowEnd?: boolean;
    smoothingLevel?: number;
  }) {
    if (properties.strokeColor !== undefined)
      this.currentStrokeColor = properties.strokeColor;
    if (properties.fillColor !== undefined)
      this.currentFillColor = properties.fillColor;
    if (properties.strokeWidth !== undefined)
      this.lineThickness = properties.strokeWidth;
    if (properties.arrowEnd !== undefined)
      this.currentArrowEnd = properties.arrowEnd;
    if (properties.smoothingLevel !== undefined)
      this.smoothingLevel = properties.smoothingLevel;

    if (this.selectionState.selectedShapeIds.size > 0) {
      this.existingShapes = this.existingShapes.map((shape) => {
        if (this.selectionState.selectedShapeIds.has(shape.id)) {
          return { ...shape, ...properties };
        }
        return shape;
      });
      this.clearCanvas();
      this.emitShapeUpdates();
    }
  }

  private getShapeBounds(shape: Shape): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    switch (shape.type) {
      case "rect":
        return {
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
        };
      case "circle": {
        const left = Math.min(shape.startX, shape.endX);
        const top = Math.min(shape.startY, shape.endY);
        const width = Math.abs(shape.endX - shape.startX);
        const height = Math.abs(shape.endY - shape.startY);
        const maxRadius = Math.max(width, height) / 2;
        return {
          x: (shape.startX + shape.endX) / 2 - maxRadius,
          y: (shape.startY + shape.endY) / 2 - maxRadius,
          width: maxRadius * 2,
          height: maxRadius * 2,
        };
      }
      case "line": {
        const minX = Math.min(shape.startX, shape.endX);
        const minY = Math.min(shape.startY, shape.endY);
        return {
          x: minX,
          y: minY,
          width: Math.abs(shape.endX - shape.startX),
          height: Math.abs(shape.endY - shape.startY),
        };
      }
      case "pencil": {
        const xs = shape.points.map((p) => p.x);
        const ys = shape.points.map((p) => p.y);
        return {
          x: Math.min(...xs),
          y: Math.min(...ys),
          width: Math.max(...xs) - Math.min(...xs),
          height: Math.max(...ys) - Math.min(...ys),
        };
      }
      case "text": {
        const textWidth = this.ctx.measureText(shape.text).width;
        return {
          x: shape.x,
          y: shape.y - shape.fontSize,
          width: textWidth,
          height: shape.fontSize,
        };
      }
    }
  }

  private startRotation(x: number, y: number) {
    const selectedShapes = this.existingShapes.filter((shape) =>
      this.selectionState.selectedShapeIds.has(shape.id)
    );
    const bounds = this.getSelectionBounds(selectedShapes);
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    this.selectionState.isRotating = true;
    this.selectionState.rotationCenter = { x: centerX, y: centerY };
    this.selectionState.rotationAngle = Math.atan2(y - centerY, x - centerX);

    this.selectionState.selectedShapeIds.forEach((id) => {
      const shape = this.existingShapes.find((s) => s.id === id);
      if (shape) {
        this.selectionState.initialShapes[id] = { ...shape };
      }
    });

    this.clearCanvas();
    this.drawSelectionOverlay();
  }

  private drawSelectionOverlay() {
    const selectedShapes = this.existingShapes.filter((shape) =>
      this.selectionState.selectedShapeIds.has(shape.id)
    );
    if (selectedShapes.length === 0) return;

    const bounds = this.getSelectionBounds(selectedShapes);

    this.ctx.save();
    this.ctx.strokeStyle = "#0096fd";
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);

    const rotations = new Set(selectedShapes.map((s) => s.rotation));
    if (rotations.size === 1) {
      const rotation = selectedShapes[0].rotation;
      const center = {
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2,
      };

      this.ctx.translate(center.x, center.y);
      this.ctx.rotate(rotation);
      this.ctx.translate(-center.x, -center.y);
    }

    this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

    const handleSize = 8;
    const halfHandle = handleSize / 2;
    this.ctx.setLineDash([]);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.strokeStyle = "#0096fd";

    const cornerPoints = [
      { x: bounds.x, y: bounds.y }, // Top-left
      { x: bounds.x + bounds.width, y: bounds.y }, // Top-right
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height }, // Bottom-right
      { x: bounds.x, y: bounds.y + bounds.height }, // Bottom-left
    ];

    cornerPoints.forEach((point) => {
      this.ctx.fillRect(
        point.x - halfHandle,
        point.y - halfHandle,
        handleSize,
        handleSize
      );
      this.ctx.strokeRect(
        point.x - halfHandle,
        point.y - halfHandle,
        handleSize,
        handleSize
      );
    });

    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const rotationHandleY = centerY - ROTATION_HANDLE_DISTANCE;

    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.lineTo(centerX, rotationHandleY);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(centerX, rotationHandleY, 5, 0, Math.PI * 2);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fill();
    this.ctx.strokeStyle = "#0096fd";
    this.ctx.stroke();

    this.ctx.restore();
  }

  public undo() {
    if (this.undoStack.length > 0) {
      const currentState = [...this.existingShapes];
      const previousState = this.undoStack.pop()!;
      this.redoStack.push(currentState);
      this.existingShapes = previousState;
      this.clearCanvas();
    }
  }

  public redo() {
    if (this.redoStack.length > 0) {
      const currentState = [...this.existingShapes];
      const nextState = this.redoStack.pop()!;
      this.undoStack.push(currentState);
      this.existingShapes = nextState;
      this.clearCanvas();
    }
  }

  public exportAsJSON(): string {
    return JSON.stringify(this.existingShapes);
  }

  public importFromJSON(json: string) {
    this.existingShapes = JSON.parse(json);
    this.clearCanvas();
  }

  public exportAsImage(): Promise<string> {
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve(url);
        }
      });
    });
  }

  public zoomIn() {
    this.scale *= 1.1;
    this.clearCanvas();
  }

  public zoomOut() {
    this.scale /= 1.1;
    this.clearCanvas();
  }

  public pan(dx: number, dy: number) {
    this.offsetX += dx;
    this.offsetY += dy;
    this.clearCanvas();
  }

  private snapToGridPoint(x: number, y: number): { x: number; y: number } {
    if (!this.snapToGrid) return { x, y };
    return {
      x: Math.round(x / this.gridSize) * this.gridSize,
      y: Math.round(y / this.gridSize) * this.gridSize,
    };
  }

  setTextAlign(align: CanvasTextAlign) {
    this.currentTextAlign = align;
  }

  setFontFamily(family: string) {
    this.currentFontFamily = family;
  }
  setFontSize(size: number) {
    this.currentFontSize = size;
  }

  public getSelectedElement(): { type: string; properties: any } | null {
    if (this.selectionState.selectedShapeIds.size === 0) return null;

    const selectedShape = this.existingShapes.find((shape) =>
      this.selectionState.selectedShapeIds.has(shape.id)
    );

    if (!selectedShape) return null;

    return {
      type: selectedShape.type,
      properties: {
        strokeColor: selectedShape.strokeColor,
        fillColor: selectedShape.fillColor,
        strokeWidth: selectedShape.strokeWidth,
        opacity: selectedShape.opacity,
        strokeStyle: selectedShape.strokeStyle,
        sloppiness: selectedShape.sloppiness,
        edges: selectedShape.edges,
        fontSize:
          selectedShape.type === "text" ? selectedShape.fontSize : undefined,
        fontFamily:
          selectedShape.type === "text" ? selectedShape.fontFamily : undefined,
        textAlign:
          selectedShape.type === "text" ? selectedShape.textAlign : undefined,
      },
    };
  }

  private drawGrid() {
    const viewport = this.camera.getViewport();
    const gridSize = 20;

    const startX =
      Math.floor(-viewport.offset.x / viewport.zoom / gridSize) * gridSize;
    const startY =
      Math.floor(-viewport.offset.y / viewport.zoom / gridSize) * gridSize;
    const endX =
      Math.ceil(
        (this.canvas.width - viewport.offset.x) / viewport.zoom / gridSize
      ) * gridSize;
    const endY =
      Math.ceil(
        (this.canvas.height - viewport.offset.y) / viewport.zoom / gridSize
      ) * gridSize;

    this.ctx.strokeStyle = "rgba(128, 128, 128, 0.2)";
    this.ctx.lineWidth = 1 / viewport.zoom;

    for (let x = startX; x <= endX; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
      this.ctx.stroke();
    }

    for (let y = startY; y <= endY; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
      this.ctx.stroke();
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.camera.applyTransform(this.ctx);
    this.drawGrid();
    this.camera.restoreTransform(this.ctx);
  }
}