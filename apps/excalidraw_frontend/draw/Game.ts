import { getExistingShapes } from "./http";
import { Point, Shape, Tool } from "./types/types";

export class Game {
  private roomId: string;
  private ctx: CanvasRenderingContext2D | null;
  private canvas: HTMLCanvasElement;
  private currentTool: Tool = "selection";
  private startX: number = 0;
  private startY: number = 0;
  private isDrawing: boolean = false;
  private socket: WebSocket;
  private elements: Shape[] = [];
  private points: Point[] = [];
  private headlen = 10;

  private isPanning: boolean = false;
  private panOffset = {x:0 , y:0};
  private panStart = {x:0, y:0}; 

  private zoom: number = 1;
  private minZoom: number = 0.1;
  private maxZoom: number = 3;
  
  private isErasing: boolean = false;

  private selectedElementIndex: number | null = null;
  private resizeHandleSize: number = 8;
  private isResizing: boolean = false
  private resizeHandle : string | undefined = undefined;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private elementStartPosition: any = null;

  private isTextEditing: boolean = false;
  private textEditingElement: number | null = null;
  private textInput: HTMLDivElement | null = null;
  private defaultFontSize: number = 20;
  private defaultFontFamily: string = "sans-serif";
  private lastClickTime: number = 0;

  private selectionChangeCallbacks: ((element: Shape | null) => void)[] = [];

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.roomId = roomId;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.socket = socket;
    this.init();
    this.socketListener();
  }

  private socketListener = () => {
    this.socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "draw" && data.roomId === this.roomId) {
          this.elements.push(data.drawing);
          this.redraw();
        }
        else if (data.type === "erase" && data.roomId === this.roomId) {
            for (let i = data.erasedIndices.length - 1; i >= 0; i--) {
                this.elements.splice(data.erasedIndices[i], 1);
            }
            this.redraw();
        } else if (data.type === "update" && data.roomId === this.roomId){
            if (data.index >= 0 && data.index < this.elements.length) {
                this.elements[data.index] = data.updatedElement;
                this.redraw();
            }
        }
      } catch (error) {
        console.error("Error processing socket message:", error);
      }
    });
  };

  init = async () => {
    const existingShapes = await getExistingShapes(this.roomId);
    this.elements = existingShapes;
    this.redraw();
    this.initMouseHandlers();
  };

  initMouseHandlers = async () => {
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener("wheel", this.handleWheel);
  };

  private handleWheel = (event: WheelEvent) => {
    event.stopPropagation();
    event.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const canvasX = (mouseX - this.panOffset.x) / this.zoom;
    const canvasY = (mouseY - this.panOffset.y) / this.zoom;

    if(event.deltaY < 0) {
        this.zoom = Math.min(this.maxZoom, this.zoom*1.1);
    } else {
        this.zoom = Math.max(this.minZoom, this.zoom / 1.1);
    }

    this.panOffset.x = mouseX - (canvasX * this.zoom);
    this.panOffset.y = mouseY - (canvasY * this.zoom);

    this.redraw();
  }

  private getElementBoundary = (element: Shape) => {
    let minX=0, minY=0, maxX=0, maxY=0;

    switch(element.type) {
        case "rect":
        case "circle":
        case "text":
            minX = element.x;
            minY = element.y;
            maxX = element.width + element.x;
            maxY = element.height + element.y;
            break;
        case "line":
        case "arrow":
            minX = Math.min(element.startingPoint.x, element.endingPoint.x);
            minY = Math.min(element.startingPoint.y, element.endingPoint.y);
            maxX = Math.max(element.startingPoint.x, element.endingPoint.x);
            maxY = Math.max(element.startingPoint.y, element.endingPoint.y);
            break;
        case "pencil":
            if (element.points.length > 0) {
                minX = maxX = element.points[0]!.x;
                minY = maxY = element.points[0]!.y;
                
                for (const point of element.points) {
                  minX = Math.min(minX, point.x);
                  minY = Math.min(minY, point.y);
                  maxX = Math.max(maxX, point.x);
                  maxY = Math.max(maxY, point.y);
                }
              }
              break;
    }
    return { minX, minY, maxX, maxY };
  }

  private isPointInsideElement = (element: Shape, x: number, y: number): boolean => {
    const { minX, minY, maxX, maxY } = this.getElementBoundary(element);
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  }

  private cloneElementPosition = (element: Shape): any => {
    if (element.type === "text") {
        return { 
          x: element.x, 
          y: element.y, 
          width: element.width, 
          height: element.height,
          fontSize: element.fontSize
        };
    }
    switch (element.type) {
      case "rect":
      case "circle":
        return { x: element.x, y: element.y, width: element.width, height: element.height };
      case "line":
      case "arrow":
        return { 
          startingPoint: { ...element.startingPoint }, 
          endingPoint: { ...element.endingPoint } 
        };
      case "pencil":
        return { 
            points: element.points.map(p => ({ ...p })),
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height
          };
      default:
        return null;
    }
  }

  private drawResizeHandles = (element: Shape) => {
    if(!this.ctx) return;
    const handleSize = this.resizeHandleSize;
  
    this.ctx.save();
    this.ctx.fillStyle = "#1E90FF";
    const { minX, minY, maxX, maxY } = this.getElementBoundary(element);
    switch (element.type) {
      case "rect":
      case "circle":
      case "pencil":
      case "text":
        this.ctx.fillRect(minX - handleSize / 2, minY - handleSize / 2, handleSize, handleSize);
        this.ctx.fillRect(maxX - handleSize / 2, minY - handleSize / 2, handleSize, handleSize); 
        this.ctx.fillRect(minX - handleSize / 2, maxY - handleSize / 2, handleSize, handleSize); 
        this.ctx.fillRect(maxX - handleSize / 2, maxY - handleSize / 2, handleSize, handleSize); 
        break;
        
      case "line":
      case "arrow":
        this.ctx.beginPath();
        this.ctx.arc(element.startingPoint.x, element.startingPoint.y, handleSize-2, 0, 2*Math.PI);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(element.endingPoint.x, element.endingPoint.y, handleSize-2, 0, 2*Math.PI);
        this.ctx.fill();
        break;
    }
    this.ctx.restore();
  }
  
  private drawSelectionBoundary = (element: Shape) => {
    if (!this.ctx) return;
    if (this.isTextEditing && 
        this.textEditingElement !== null && 
        this.elements[this.textEditingElement] === element) {
      return;
    }
    this.ctx.save();
    
    this.ctx.strokeStyle = "#1E90FF";
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([]);
    const { minX, minY, maxX, maxY } = this.getElementBoundary(element);
        
    switch (element.type) {
      case "rect":
      case "circle":
      case "pencil":
      case "text":
        this.ctx.strokeRect(minX - 5, minY - 5, maxX - minX + 10, maxY - minY + 10);
        break;
      }
      
      this.ctx.restore();
      if (this.currentTool === "selection") {
        this.drawResizeHandles(element);
      }
    }

  public isPointOnSelectionBoundary = (element: Shape, x: number, y: number) => {
    const { minX, minY, maxX, maxY } = this.getElementBoundary(element);
    const handleSize = this.resizeHandleSize;

    switch (element.type) {
        case "circle":
        case "rect":
        case "pencil":
        case "text":
            if(Math.abs(x-minX)<=handleSize/2 && Math.abs(y-minY)<=handleSize/2) {
                return { onBoundary: true, handlePosition: "top-left" };
            } 
            if(Math.abs(x-maxX)<=handleSize/2 && Math.abs(y-minY)<=handleSize/2) {
                return { onBoundary: true, handlePosition: "top-right"};
            }
            if(Math.abs(x-maxX)<=handleSize/2 && Math.abs(y-maxY)<=handleSize/2) {
                return { onBoundary: true, handlePosition: "bottom-right"};
            }
            if(Math.abs(x-minX)<=handleSize/2 && Math.abs(y-maxY)<=handleSize/2) {
                return { onBoundary: true, handlePosition: "bottom-left"};
            }
        break;
        case "line":
        case "arrow":
            if (Math.sqrt(Math.pow(x - element.startingPoint.x, 2) + Math.pow(y - element.startingPoint.y, 2)) <= handleSize) {
                return { onBoundary: true, handlePosition: "start" };
            }
            if (Math.sqrt(Math.pow(x - element.endingPoint.x, 2) + Math.pow(y - element.endingPoint.y, 2)) <= handleSize) {
                return { onBoundary: true, handlePosition: "end" };
            }
    }
    return { onBoundary: false };
  }

  private applyResizeToElement(element: Shape, currentX: number, currentY: number, handle: string): Shape {
    if (!this.elementStartPosition) return element;
    
    const updatedElement = { ...element };
    const original = this.elementStartPosition;
    
    if (updatedElement.type === "line" || updatedElement.type === "arrow") {
      if (handle === "start") {
        updatedElement.startingPoint = { x: currentX, y: currentY };
        return updatedElement;
      } else if (handle === "end") {
        updatedElement.endingPoint = { x: currentX, y: currentY };
        return updatedElement;
      }
    }
    
    let x = original.x;
    let y = original.y;
    let width = original.width;
    let height = original.height;
    
    if (handle.includes("left")) {
      const newX = currentX;
      width = original.x + original.width - newX;
      x = newX;
    } else if (handle.includes("right")) {
      width = currentX - original.x;
    }
    
    if (handle.includes("top")) {
      const newY = currentY;
      height = original.y + original.height - newY;
      y = newY;
    } else if (handle.includes("bottom")) {
      height = currentY - original.y;
    }
    
    if (width < 0) {
      x = x + width;
      width = Math.abs(width);
    }
    
    if (height < 0) {
      y = y + height;
      height = Math.abs(height);
    }
    
    width = Math.max(width, 20);
    if (updatedElement.type != "line" && updatedElement.type != "arrow") {
      updatedElement.x = x;
      updatedElement.y = y;
      updatedElement.width = width;
      if (updatedElement.type != "text") updatedElement.height = height;
    }
    
    if (updatedElement.type === "text") {
      if (handle.includes("right") || handle.includes("left")) {
        updatedElement.maxWidth = width;
      }
      
      if (handle === "top-left" || handle === "top-right" || 
          handle === "bottom-left" || handle === "bottom-right") {
        const heightRatio = height / original.height;
        updatedElement.fontSize = Math.max(10, Math.round(original.fontSize * heightRatio));
      }
      
      if (this.ctx && updatedElement.content) {
        updatedElement.height = this.calculateTextHeight(
          updatedElement.content,
          updatedElement.width,
          updatedElement.fontSize!
        );
      }
    }
    
    if (updatedElement.type === "pencil" && updatedElement.points) {
      const newPoints = original.points.map((point: Point) => {
        const relX = original.width === 0 ? 0 : (point.x - original.x) / original.width;
        const relY = original.height === 0 ? 0 : (point.y - original.y) / original.height;
        
        return {
          x: x + (relX * width),
          y: y + (relY * height)
        };
      });
      
      updatedElement.points = newPoints;
    }
    
    return updatedElement;
  }

  private getTextLines(text: string, maxWidth: number): string[] {
    if (!this.ctx || !text) return [];
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0] || "";
    
    for (let i = 1; i < words.length; i++) {
      const word = words[i]!;
      const testLine = currentLine + " " + word;
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width < maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    
    lines.push(currentLine);
    return lines;
  }

  private calculateTextHeight(text: string, width: number, fontSize: number): number {
    if (!this.ctx || !text) return fontSize * 1.2;
    
    const lines = this.getTextLines(text, width);
    return lines.length * fontSize * 1.2;
  }

  private initTextEditing(elementIndex: number): void {
    if (this.isTextEditing && this.textEditingElement !== null && this.textInput) {
      this.finishTextEditing();
    }
  
    const element = this.elements[elementIndex]!;
    if (element.type !== "text") return;
    
    if (element.width === 0) {
      element.width = element.maxWidth || 400;
    }
    
    this.isTextEditing = true;
    this.textEditingElement = elementIndex;
    
    if (!this.textInput) {
      const editable = document.createElement("div");
      this.textInput = editable;
      document.body.appendChild(editable);
      
      editable.addEventListener("input", this.handleTextInput);
      editable.addEventListener("blur", this.finishTextEditing);
      editable.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.finishTextEditing();
        }
      });
    }
  
    const rect = this.canvas.getBoundingClientRect();
    const screenX = (element.x * this.zoom) + this.panOffset.x + rect.left;
    const screenY = (element.y * this.zoom) + this.panOffset.y + rect.top;
  
    const textInput = this.textInput;
    textInput.contentEditable = "true";
    textInput.style.position = "absolute";
    textInput.style.left = `${screenX}px`;
    textInput.style.top = `${screenY}px`;
    textInput.style.minWidth = `20px`; 
    textInput.style.maxWidth = `${(element.maxWidth || 400) * this.zoom}px`;
    textInput.style.width = `${element.width * this.zoom}px`;
    textInput.style.minHeight = `${element.fontSize! * 1.2 * this.zoom}px`;
    textInput.style.padding = "0px";
    textInput.style.margin = "0px";
    textInput.style.background = "transparent";
    textInput.style.color = "#fff";
    textInput.style.fontFamily = element.fontFamily!;
    textInput.style.fontSize = `${element.fontSize! * this.zoom}px`;
    textInput.style.lineHeight = "1.2";
    textInput.style.outline = "none";
    textInput.style.border = "none";
    textInput.style.caretColor = "#fff";
    textInput.style.overflow = "hidden";
    textInput.style.whiteSpace = "pre-wrap";
    textInput.style.zIndex = "1000";
    textInput.style.textAlign = element.textAlign || "left";
    textInput.innerText = element.content || "";
    
    textInput.focus();
    
    const range = document.createRange();
    range.selectNodeContents(textInput);
    range.collapse(false);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    this.handleTextInput();
    this.redraw();
  }

  private handleTextInput = (): void => {
    if (!this.textInput || this.textEditingElement === null) return;
    
    const element = this.elements[this.textEditingElement];
    if (element && element.type === "text") {
      element.content = this.textInput.innerText;
      
      if (this.ctx) {
        this.ctx.font = `${element.fontSize}px ${element.fontFamily}`;
        
        const maxWidth = element.maxWidth || 400;
        const lines = this.getTextLines(element.content, maxWidth);
        let maxLineWidth = 0;
        
        for (const line of lines) {
          const metrics = this.ctx.measureText(line);
          maxLineWidth = Math.max(maxLineWidth, metrics.width);
        }
        
        element.width = Math.min(maxLineWidth + 10, maxWidth);
        
        const textHeight = this.calculateTextHeight(
          element.content, 
          element.width, 
          element.fontSize!
        );
        element.height = textHeight;
        
        this.textInput.style.width = `${element.width * this.zoom}px`;
        this.textInput.style.minHeight = `${element.height * this.zoom}px`;
      }
    }
  };

  private finishTextEditing = (): void => {
    if (this.textEditingElement === null || !this.textInput) return;
    
    const element = this.elements[this.textEditingElement]!;
    const inputToRemove = this.textInput;
    
    if (element && element.type === "text") {
      element.content = this.textInput.innerText;
      
      if (!element.content || element.content.trim() === "") {
        this.elements.splice(this.textEditingElement, 1);
        this.selectedElementIndex = null;
        this.notifySelectionChange();
      } else {
        if (this.ctx) {
          this.ctx.font = `${element.fontSize}px ${element.fontFamily}`;
          
          const maxWidth = element.maxWidth || 400;
          const lines = this.getTextLines(element.content, maxWidth);
          let maxLineWidth = 0;
          
          for (const line of lines) {
            const metrics = this.ctx.measureText(line);
            maxLineWidth = Math.max(maxLineWidth, metrics.width);
          }
          
          element.width = Math.min(maxLineWidth + 10, maxWidth);
        }
        
        const textHeight = this.calculateTextHeight(
          element.content, 
          element.width!, 
          element.fontSize!
        );
        element.height = textHeight;
        
        this.socket.send(
          JSON.stringify({
            type: "draw",
            drawing: element,
            roomId: this.roomId,
          })
        );
      }
    }
    
    this.textInput = null;
    this.isTextEditing = false;
    this.textEditingElement = null;
    
    try {
      if (inputToRemove && document.body.contains(inputToRemove)) {
        document.body.removeChild(inputToRemove);
      }
    } catch (error) {
      console.warn("Text input element already removed:", error);
    }
    
    this.redraw();
  };


private handleMouseDown = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
  
    if (this.currentTool == "pan") {
      this.isPanning = true;
      this.panStart.x = event.clientX;
      this.panStart.y = event.clientY;
      document.body.style.cursor = "grabbing";
      return;
    }
    
    const result = this.screenToCanvas(event.clientX, event.clientY);
    const canvasX = result.clientX;
    const canvasY = result.clientY;
    
    if (this.isTextEditing) {
      this.finishTextEditing();
      return;
    }
  
    this.redraw();
    let clickedOnElement = false;
    
    if (this.currentTool === "text") {
      const textElement = this.createTextElement(canvasX, canvasY);
      this.elements.push(textElement);
      const index = this.elements.length - 1;
      this.selectedElementIndex = index;
      this.initTextEditing(index);
      this.notifySelectionChange(); 
      return;
    }
  
    if (["line", "rect", "circle", "pencil", "arrow"].includes(this.currentTool)) {
      this.startX = canvasX;
      this.startY = canvasY;
      this.isDrawing = true;
    } else if (this.currentTool == "eraser") {
      this.isErasing = true;
      this.createEraserCursor(canvasX, canvasY);
      this.selectedElementIndex = null;
      this.notifySelectionChange();
    } else if (this.currentTool == "selection") {
      if (this.selectedElementIndex !== null) {
        const element = this.elements[this.selectedElementIndex]!;
  
        if (element && element.type === "text" && this.isPointInsideElement(element, canvasX, canvasY)) {
          clickedOnElement = true;
          const now = Date.now();
          if (this.lastClickTime && now - this.lastClickTime < 300) {
            this.initTextEditing(this.selectedElementIndex);
            this.lastClickTime = 0;
            return;
          }
          this.lastClickTime = now;
        }
        
        const {onBoundary, handlePosition} = this.isPointOnSelectionBoundary(element!, canvasX, canvasY);
        if (onBoundary) {
          this.isResizing = true;
          this.resizeHandle = handlePosition;
          this.dragStartX = canvasX;
          this.dragStartY = canvasY;
          this.elementStartPosition = this.cloneElementPosition(element!);
          
          switch (handlePosition) {
            case "top-left":
            case "bottom-right":
              document.body.style.cursor = "nwse-resize";
              break;
            case "top-right":
            case "bottom-left":
              document.body.style.cursor = "nesw-resize";
              break;
            case "start":
            case "end":
              document.body.style.cursor = "pointer";
          }
          return;
        }
        
        if (this.isPointInsideElement(element, canvasX, canvasY)) {
          switch (element.type) {
            case "arrow":
            case "line":
              if (this.isLineNearPoint(
                element.startingPoint.x, element.startingPoint.y,
                element.endingPoint.x, element.endingPoint.y,
                canvasX, canvasY, 10)) {
                this.isDragging = true;
                this.dragStartX = canvasX;
                this.dragStartY = canvasY;
                this.elementStartPosition = this.cloneElementPosition(element);
                document.body.style.cursor = "move";
              }
              break;
            case "circle":
            case "pencil":
            case "rect":
            case "text":
              this.isDragging = true;
              this.dragStartX = canvasX;
              this.dragStartY = canvasY;
              this.elementStartPosition = this.cloneElementPosition(element);
              document.body.style.cursor = "move";
              break;
          }
          return;
        }
        if (this.isDragging) return;
      }
      
      if (!clickedOnElement) {
        const oldSelectedIndex = this.selectedElementIndex;
        this.selectedElementIndex = null;
        this.notifySelectionChange()
        for (let i = this.elements.length - 1; i >= 0; i--) {
          const element = this.elements[i];
          if (element && this.isElementUnderEraser(element, canvasX, canvasY, 10)) {
            clickedOnElement = true;
            this.selectedElementIndex = i;
            this.notifySelectionChange();
            break;
          }
          if (element && element.type == "text" && this.isPointInsideElement(element, canvasX, canvasY)) {
            this.selectedElementIndex = i;
            this.notifySelectionChange();
            clickedOnElement = true;
            break;
          }
        }
        
        if (oldSelectedIndex !== this.selectedElementIndex) {
          this.notifySelectionChange();
        }
      }
    }
    this.redraw();
  };

  private createEraserCursor = (x: number, y: number) => {
    if (!this.ctx) return;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 10, 0, 2 * Math.PI);
    this.ctx.strokeStyle = "#fff";
    this.ctx.stroke();
    document.body.style.cursor = "none"
  };

  private eraseAtPosition = (x: number, y: number) => {
    const eraserRadius = 10;
    const elementsToRemove: number[] = [];
    this.elements.forEach((element, index) => {
      if (this.isElementUnderEraser(element, x, y, eraserRadius)) {
        elementsToRemove.push(index);
      }
    });
    if(elementsToRemove.length> 0) {
        for (let i = elementsToRemove.length - 1; i >= 0; i--) {
            this.elements.splice(elementsToRemove[i]!, 1);
        }
        this.redraw();
        this.socket.send(
            JSON.stringify({
                type: "erase",
                erasedIndices: elementsToRemove,
                roomId: this.roomId,
            })
        );
    }
  };

  private isElementUnderEraser(
    element: Shape,
    x: number,
    y: number,
    radius: number
  ): boolean {
    if (element.type === "text") {
        return x >= element.x! - radius && 
               x <= element.x! + element.width! + radius && 
               y >= element.y! - radius && 
               y <= element.y! + element.height! + radius;
    }
    switch (element.type) {
      case "line":
        return this.isLineNearPoint(
          element.startingPoint.x,
          element.startingPoint.y,
          element.endingPoint.x,
          element.endingPoint.y,
          x,
          y,
          radius
        );
      case "rect":
        return this.isPointOnRect(x, y, radius, element);
      case "circle":
        return this.isPointOnCircle(x, y, radius, element);
      case "pencil":
        return this.isPolylineNearPoint(element.points, x, y, radius);
      case "arrow":
        return this.isLineNearPoint(
          element.startingPoint.x,
          element.startingPoint.y,
          element.endingPoint.x,
          element.endingPoint.y,
          x,
          y,
          radius
        );
      default:
        return false;
    }
  }

  private isLineNearPoint(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    px: number,
    py: number,
    tolerance: number
  ): boolean {

    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) param = dot / len_sq;

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

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy) < tolerance;
  }

  private isPointOnRect(
    px: number,
    py: number,
    tolerance: number,
    rect: Shape
  ): boolean {
    if (rect.type !== "rect") return false;
    if (this.isLineNearPoint(
        rect.x, rect.y,
        rect.x + rect.width, rect.y,
        px, py, tolerance
      )) return true;
      
      if (this.isLineNearPoint(
        rect.x + rect.width, rect.y,
        rect.x + rect.width, rect.y + rect.height,
        px, py, tolerance
      )) return true;
      
      if (this.isLineNearPoint(
        rect.x + rect.width, rect.y + rect.height,
        rect.x, rect.y + rect.height,
        px, py, tolerance
      )) return true;
      
      if (this.isLineNearPoint(
        rect.x, rect.y + rect.height,
        rect.x, rect.y,
        px, py, tolerance
      )) return true;
      
      return false;
  }

  private isPointOnCircle(
    px: number,
    py: number,
    tolerance: number,
    circle1: Shape
  ): boolean {
    if(circle1.type != "circle") {
        return false;
    }

    const circle = {
        type: circle1.type,
        centerX: circle1.x + circle1.width/2,
        centerY: circle1.y + circle1.height/2,
        radius: {
            x : circle1.width/2,
            y: circle1.height/2
        }
    }
    
    const dx = px - circle.centerX;
    const dy = py - circle.centerY;
    
    if (circle.radius.x === 0 || circle.radius.y === 0) return false;
    
    const normalizedDistance = Math.pow(dx / circle.radius.x, 2) + Math.pow(dy / circle.radius.y, 2);
    
    const lowerBound = Math.pow(1 - tolerance / Math.min(circle.radius.x, circle.radius.y), 2);
    const upperBound = Math.pow(1 + tolerance / Math.min(circle.radius.x, circle.radius.y), 2);
    
    return normalizedDistance >= lowerBound && normalizedDistance <= upperBound;
  }

  private isPolylineNearPoint(
    points: Point[],
    px: number,
    py: number,
    tolerance: number
  ): boolean {
    if(points.length >1) {
        for (let i = 0; i < points.length - 1; i++) {
            if (
                this.isLineNearPoint(
                points[i]!.x,
                points[i]!.y,
                points[i + 1]!.x,
                points[i + 1]!.y,
                px,
                py,
                tolerance
                )
            ) {
                return true;
            }
        }
    }
    return false;
  }

  private applyDragToElement = (element: Shape, currentX: number, currentY: number): Shape => {
    if (!this.elementStartPosition) return element;
    
    const deltaX = currentX - this.dragStartX;
    const deltaY = currentY - this.dragStartY;
    
    const updatedElement = { ...element };

    if (updatedElement.type === "text") {
        updatedElement.x = this.elementStartPosition.x + deltaX;
        updatedElement.y = this.elementStartPosition.y + deltaY;
        return updatedElement;
    }

    switch (updatedElement.type) {
        case "rect":
        case "circle":
            updatedElement.x = this.elementStartPosition.x + deltaX;
            updatedElement.y = this.elementStartPosition.y + deltaY;
        break;
        case "line":
        case "arrow":
            updatedElement.startingPoint = {
            x: this.elementStartPosition.startingPoint.x + deltaX,
            y: this.elementStartPosition.startingPoint.y + deltaY
            };
            updatedElement.endingPoint = {
            x: this.elementStartPosition.endingPoint.x + deltaX,
            y: this.elementStartPosition.endingPoint.y + deltaY
            };
        break;
        case "pencil":
            updatedElement.x = this.elementStartPosition.x + deltaX;
            updatedElement.y = this.elementStartPosition.y + deltaY;
            updatedElement.points = this.elementStartPosition.points.map((p: Point) => ({
            x: p.x + deltaX,
            y: p.y + deltaY
            }));
        break;
    }
    
    return updatedElement;
  }

  private handleMouseUp = (event: MouseEvent) => {
    event.preventDefault();

    if (!this.isDrawing && !this.isPanning && !this.isErasing && this.isDragging && this.isResizing)   return;
    
    if(this.currentTool == "pan" && this.isPanning) {
        this.isPanning = false;
        document.body.style.cursor = "default";
        console.log("panning offset", this.panOffset);
        this.redraw();
        return;
    }

    let shape: Shape | null = null;
    const result = this.screenToCanvas(event.clientX, event.clientY);
    const canvasX = result.clientX;
    const canvasY = result.clientY;

    if (this.isDragging && this.selectedElementIndex !== null) {
        this.isDragging = false;
        document.body.style.cursor = "default";

        this.socket.send(
          JSON.stringify({
            type: "update",
            index: this.selectedElementIndex,
            updatedElement: this.elements[this.selectedElementIndex],
            roomId: this.roomId,
          })
        );
        this.elementStartPosition = null;
    }

    if (this.isResizing && this.selectedElementIndex !== null) {
        this.isResizing = false;
        document.body.style.cursor = "default";
        this.resizeHandle = "";
        
        this.socket.send(
          JSON.stringify({
            type: "update",
            index: this.selectedElementIndex,
            updatedElement: this.elements[this.selectedElementIndex],
            roomId: this.roomId,
          })
        );
        this.elementStartPosition = null;
      }

    const dx = Math.abs(canvasX - this.startX);
    const dy = Math.abs(canvasY - this.startY);
    const minDragDistance = 3;
    const isValidDrag = dx > minDragDistance || dy > minDragDistance;

    if (this.currentTool == "line") {
      shape = {
        type: "line",
        startingPoint: {
          x: this.startX,
          y: this.startY,
        },
        endingPoint: {
          x: canvasX,
          y: canvasY,
        },
      }
    } else if (this.currentTool == "rect") {
      shape = {
        type: "rect",
        x: this.startX,
        y: this.startY,
        width: canvasX - this.startX,
        height: canvasY - this.startY,
      }
    } else if (this.currentTool == "circle") {
      shape = {
        type: "circle",
        x: this.startX,
        y: this.startY,
        width: canvasX - this.startX,
        height: canvasY - this.startY,
      }
    } else if (this.currentTool == "pencil") {
        const tempShape = {
            type: "pencil",
            points: this.points,
            x:-1,
            y:-1,
            width: -1,
            height: -1
        }
        const boundary = this.getElementBoundary(tempShape as Shape);
        const { minX, minY, maxX, maxY } = boundary;
        shape = {
            type: "pencil",
            points: this.points,
            x: minX,
            y: minY,
            width : maxX-minX,
            height: maxY-minY
        }
        this.points = [];
    } else if (this.currentTool == "arrow") {
      shape = {
        type: "arrow",
        startingPoint: {
          x: this.startX,
          y: this.startY,
        },
        endingPoint: {
          x: canvasX,
          y: canvasY,
        },
      }
    } else if(this.currentTool == "eraser" && this.isErasing) {
        this.isErasing = false;
        this.selectedElementIndex = null;
        this.notifySelectionChange();
        document.body.style.cursor = "default";
    }
    if(isValidDrag) {
        if(shape) {
            this.elements.push(shape);
            this.socket.send(
                JSON.stringify({
                    type: "draw",
                    drawing: shape,
                    roomId: this.roomId,
                })
            );
        }
    }
    this.resetInteractionStates();
    this.redraw();
  };

  private handleMouseMove = (event: MouseEvent) => {
    if (!this.ctx) return;
    event.stopPropagation();
    event.preventDefault();
    this.redraw();
    if(this.isTextEditing) {
        this.redraw();
        return;
    }

    if(this.currentTool == "pan" && this.isPanning) {
        const deltaX = event.clientX - this.panStart.x;
        const deltaY = event.clientY - this.panStart.y;

        this.panOffset.x += deltaX;
        this.panOffset.y += deltaY;

        this.panStart.x = event.clientX;
        this.panStart.y = event.clientY;
        
        this.redraw();
        return;
    }
    
    const result = this.screenToCanvas(event.clientX, event.clientY);
    const canvasX = result.clientX;
    const canvasY = result.clientY;

    if(this.isDragging && this.selectedElementIndex !== null) {
        const updatedElement = this.applyDragToElement(
            this.elements[this.selectedElementIndex]!, 
            canvasX, 
            canvasY
        );
        
        this.elements[this.selectedElementIndex] = updatedElement;
        this.redraw();
        return;
    }

    if(this.isResizing && this.selectedElementIndex !== null) {
        const updatedElement = this.applyResizeToElement(this.elements[this.selectedElementIndex]!, 
            canvasX, 
            canvasY,
            this.resizeHandle!
        );
        this.elements[this.selectedElementIndex] = updatedElement;
        this.redraw();
        return;
    }
    
    if (this.currentTool == "line" && this.isDrawing) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.startX, this.startY);
      this.ctx.lineTo(canvasX, canvasY);
      this.ctx.strokeStyle = "#fff";
      this.ctx.stroke();
    } else if (this.currentTool == "rect" && this.isDrawing) {
      this.ctx?.strokeRect(
        this.startX,
        this.startY,
        canvasX - this.startX,
        canvasY - this.startY
      );
    } else if (this.currentTool == "circle" && this.isDrawing) {
      this.ctx.beginPath();
      this.ctx.ellipse(
        (canvasX - this.startX) / 2 + this.startX,
        (canvasY - this.startY) / 2 + this.startY,
        Math.abs((canvasX - this.startX) / 2),
        Math.abs((canvasY - this.startY) / 2),
        0,
        0,
        2 * Math.PI,
        true
      );
      this.ctx.stroke();
    } else if (this.currentTool == "pencil" && this.isDrawing) {
      this.points.push({ x: canvasX, y: canvasY });
      this.ctx.beginPath();
      for (const point of this.points) {
        this.ctx.lineTo(point.x, point.y);
        this.ctx.stroke();
      }
    } else if (this.currentTool == "arrow" && this.isDrawing) {
      const dx = canvasX - this.startX;
      const dy = canvasY - this.startY;
      const angle = Math.atan2(dy, dx);
      const length = Math.sqrt(dx * dx + dy * dy);
      this.ctx.beginPath();
      this.ctx.moveTo(this.startX, this.startY);
      this.ctx.lineTo(canvasX, canvasY);
      this.ctx.stroke();
      if (length >= 10) {
        this.ctx.beginPath();
        this.ctx.moveTo(
          canvasX - this.headlen * Math.cos(angle - Math.PI / 6),
          canvasY - this.headlen * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(canvasX, canvasY);
        this.ctx.lineTo(
          canvasX - this.headlen * Math.cos(angle + Math.PI / 6),
          canvasY - this.headlen * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
      }
    } else if (this.isErasing && this.currentTool == "eraser") {
        this.createEraserCursor(canvasX, canvasY);
        this.eraseAtPosition(canvasX, canvasY);
    }
  };

  private resetInteractionStates() {
    this.isDrawing = false;
    this.isPanning = false;
    this.isResizing = false;
    this.isDragging = false;
    this.isErasing = false;
    this.resizeHandle = undefined;
    document.body.style.cursor = "default";
  }

  public setTool = (tool: Tool) => {
    if (this.isTextEditing) {
      this.finishTextEditing();
    }
    
    this.resetInteractionStates();
    this.currentTool = tool;
    
    if (tool !== "selection") {
      this.selectedElementIndex = null;
      this.notifySelectionChange();
    }
    
    this.redraw();
  };

  private createTextElement(x: number, y: number): Shape {
    return {
      type: "text",
      x,
      y,
      width: 0,
      height: this.defaultFontSize * 1.2,
      content: "",
      fontSize: this.defaultFontSize,
      fontFamily: this.defaultFontFamily,
      maxWidth: 400
    };
  }

  public redraw = () => {
    if (!this.ctx || !this.canvas) {
        return;
    }

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = "#fff";
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([]);
    this.ctx.globalAlpha = 1.0;

    this.ctx.setTransform(this.zoom, 0, 0, this.zoom, this.panOffset.x, this.panOffset.y);

    this.elements.forEach((element: Shape) => {
      this.applyElementStyles(element);

      switch (element.type) {
        case "line":
          this.ctx?.beginPath();
          this.ctx?.moveTo(element.startingPoint.x, element.startingPoint.y);
          this.ctx?.lineTo(element.endingPoint.x, element.endingPoint.y);
          this.ctx?.stroke();
          break;
        case "rect":
          if (element.fillColor) {
            this.ctx!.fillRect(
              element.x,
              element.y,
              element.width,
              element.height
            );
          }
          this.ctx?.strokeRect(
            element.x,
            element.y,
            element.width,
            element.height
          );
          break;
        case "circle":
          this.ctx?.beginPath();
          this.ctx?.ellipse(
            element.x + element.width/2,
            element.y + element.height/2,
            element.width/2,
            element.height/2,
            0,
            0,
            2 * Math.PI,
            true
          );
          if (element.fillColor) {
            this.ctx!.fill();
          }
          this.ctx?.stroke();
          break;
        case "pencil":
          this.ctx?.beginPath();
          if (element.points.length > 0) {
            this.ctx?.moveTo(element.points[0]!.x, element.points[0]!.y);
            for (const point of element.points) {
              this.ctx?.lineTo(point.x, point.y);
            }
            this.ctx?.stroke();
          }
          break;
        case "arrow": {
          const dy = element.endingPoint.y - element.startingPoint.y;
          const dx = element.endingPoint.x - element.startingPoint.x;
          const angle = Math.atan2(dy, dx);
          this.ctx?.beginPath();
          this.ctx?.moveTo(element.startingPoint.x, element.startingPoint.y);
          this.ctx?.lineTo(element.endingPoint.x, element.endingPoint.y);
          this.ctx?.stroke();
          const length = Math.sqrt(dx * dx + dy * dy);
          if (length >= 10) {
            this.ctx?.beginPath();
            this.ctx?.moveTo(
              element.endingPoint.x -
                this.headlen * Math.cos(angle - Math.PI / 6),
              element.endingPoint.y -
                this.headlen * Math.sin(angle - Math.PI / 6)
            );
            this.ctx?.lineTo(element.endingPoint.x, element.endingPoint.y);
            this.ctx?.lineTo(
              element.endingPoint.x -
                this.headlen * Math.cos(angle + Math.PI / 6),
              element.endingPoint.y -
                this.headlen * Math.sin(angle + Math.PI / 6)
            );
            this.ctx?.stroke();
          }
        }
        break;
        case "text":
        if (this.ctx) {
            if (this.isTextEditing && this.textEditingElement !== null && 
                element == this.elements[this.textEditingElement!]) {
              break;
            }
            
            this.ctx.font = `${element.fontSize}px ${element.fontFamily}`;
            this.ctx.fillStyle = element.fillColor || element.strokeColor || "#fff";
            
            const lines = this.getTextLines(element.content || "", element.width!);
            for (let i = 0; i < lines.length; i++) {
              let xPos = element.x!;
              
              if (element.textAlign === "center") {
                const lineWidth = this.ctx.measureText(lines[i]!).width;
                xPos = element.x! + (element.width! - lineWidth) / 2;
              } else if (element.textAlign === "right") {
                const lineWidth = this.ctx.measureText(lines[i]!).width;
                xPos = element.x! + element.width! - lineWidth;
              }
              
              this.ctx.fillText(
                lines[i]!, 
                xPos, 
                element.y! + (i + 1) * (element.fontSize! * 1.2)
              );
            }
        }
      break;
      }
      
      this.ctx!.globalAlpha = 1.0;
    });
    
    if (this.selectedElementIndex !== null && this.elements[this.selectedElementIndex]) {
        this.drawSelectionBoundary(this.elements[this.selectedElementIndex]!);   
    }
};

private applyElementStyles(element: Shape) {
    if (!this.ctx) return;
    
    this.ctx.strokeStyle = "#fff";
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([]);
    this.ctx.globalAlpha = 1.0;
    this.ctx.fillStyle = "#fff";
    
    if (element.strokeColor) {
        this.ctx.strokeStyle = element.strokeColor;
    }
    
    if (element.fillColor) {
        this.ctx.fillStyle = element.fillColor;
    }
    
    if (element.strokeWidth) {
        this.ctx.lineWidth = element.strokeWidth;
    }
    
    if (element.opacity !== undefined) {
        this.ctx.globalAlpha = element.opacity;
    }
    
    if (element.strokeStyle) {
        switch (element.strokeStyle) {
            case "solid":
                this.ctx.setLineDash([]);
                break;
            case "dashed":
                this.ctx.setLineDash([10, 5]);
                break;
            case "dotted":
                this.ctx.setLineDash([2, 2]);
                break;
        }
    }
}

  private screenToCanvas(screenX: number, screenY: number): {clientX: number, clientY: number} {
    const rect = this.canvas.getBoundingClientRect();
    return {
        clientX: ((screenX - rect.left) - this.panOffset.x) /this.zoom,
        clientY: ((screenY - rect.top) - this.panOffset.y) /this.zoom
    };
  }

  public destroy = () => {
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
    this.canvas.removeEventListener("wheel", this.handleWheel);

    if (this.isTextEditing && this.textInput) {
        document.body.removeChild(this.textInput);
        this.textInput = null;
    }
  };

  public onSelectionChange = (callback: (element: Shape | null) => void) => {
    this.selectionChangeCallbacks.push(callback);
    return () => {
        this.selectionChangeCallbacks = this.selectionChangeCallbacks.filter(cb => cb !== callback);
    };
  };

  private notifySelectionChange() {
    const selectedElement = this.selectedElementIndex !== null 
        ? { ...this.elements[this.selectedElementIndex] }
        : null;
    
    this.selectionChangeCallbacks.forEach(callback => {
        callback(selectedElement as Shape);
    });
  }

  private sendUpdateToWS = () => {
    this.socket.send(
        JSON.stringify({
          type: "update",
          index: this.selectedElementIndex,
          updatedElement: this.elements[this.selectedElementIndex!],
          roomId: this.roomId,
        })
      );
  }

  public setFontSize = (size: number) => {
    if(this.selectedElementIndex == null) return;
    const element = this.elements[this.selectedElementIndex];
    if(element?.type =="text") {
        element.fontSize = size;
        this.sendUpdateToWS();
        this.notifySelectionChange();
        this.redraw();
    }
  }

  public setFontFamily = (family: string) => {
    if(this.selectedElementIndex == null) return;
    const element = this.elements[this.selectedElementIndex];
    if(element?.type =="text") {
        element.fontFamily = family;
        this.sendUpdateToWS();
        this.notifySelectionChange();
        this.redraw();
    }
  }

  public setTextAlign = (align: string) => {
    if(this.selectedElementIndex == null) return;
    const element = this.elements[this.selectedElementIndex];
    if(element?.type =="text") {
        element.textAlign = align;
        this.sendUpdateToWS();
        this.notifySelectionChange();
        this.redraw();
    }
  }

  public setStrokeColor = (color: string) => {
    if(this.selectedElementIndex == null) return;
    const element = this.elements[this.selectedElementIndex]!;
    element.strokeColor = color;
    this.sendUpdateToWS();
    this.notifySelectionChange();
    this.redraw();
  }

  public setFillColor = (color: string) => {
    if(this.selectedElementIndex == null) return;
    const element = this.elements[this.selectedElementIndex]!;
    element.fillColor = color;
    this.sendUpdateToWS();
    this.notifySelectionChange();
    this.redraw();
  }

  public setStrokeWidth = (width: number) => {
    if(this.selectedElementIndex == null) return;
    const element = this.elements[this.selectedElementIndex]!;
    element.strokeWidth = width;
    this.sendUpdateToWS();
    this.notifySelectionChange();
    this.redraw();
  }

  public setOpacity = (opacity: number) => {
    if(this.selectedElementIndex == null) return;
    const element = this.elements[this.selectedElementIndex]!;
    element.opacity = opacity;
    this.sendUpdateToWS();
    this.notifySelectionChange();
    this.redraw();
  }

  public setStrokeStyle = (stroke: string) => {
    if(this.selectedElementIndex == null) return;
    const element = this.elements[this.selectedElementIndex]!;
    element.strokeStyle = stroke;
    this.sendUpdateToWS();
    this.notifySelectionChange();
    this.redraw();
  }

}