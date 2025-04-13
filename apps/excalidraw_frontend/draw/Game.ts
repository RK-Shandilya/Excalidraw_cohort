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

  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private elementStartPosition: any = null;

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

    if(event.deltaY < 0) {
        this.zoom = Math.min(this.maxZoom, this.zoom*1.1);
    } else {
        this.zoom = Math.max(this.minZoom, this.zoom / 1.1);
    }
    this.redraw();
  }

  private getElementBoundary = (element: Shape) => {
    let minX=0, minY=0, maxX=0, maxY=0;

    switch(element.type) {
        case "rect":
            minX = element.x;
            minY = element.y;
            maxX = element.width + element.x;
            maxY = element.height + element.y;
            break;
        case "circle":
            minX = element.centerX - element.radius.x;
            minY = element.centerY - element.radius.y;
            maxX = element.centerX + element.radius.x;
            maxY = element.centerY + element.radius.y;
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
    switch (element.type) {
      case "rect":
        return { x: element.x, y: element.y, width: element.width, height: element.height };
      case "circle":
        return { centerX: element.centerX, centerY: element.centerY, radius: element.radius };
      case "line":
      case "arrow":
        return { 
          startingPoint: { ...element.startingPoint }, 
          endingPoint: { ...element.endingPoint } 
        };
      case "pencil":
        return { points: element.points.map(p => ({ ...p })) };
      default:
        return null;
    }
  }

  private drawResizeHandles = (element: Shape) => {
    if(!this.ctx) return;
    const { minX, minY, maxX, maxY } = this.getElementBoundary(element);
    const handleSize = this.resizeHandleSize;
  
    this.ctx.save();
    this.ctx.fillStyle = "#1E90FF";
  
    switch (element.type) {
      case "rect":
      case "circle":
      case "pencil":
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
    
    this.ctx.save();
    
    this.ctx.strokeStyle = "#1E90FF";
    this.ctx.lineWidth = 2;

    const { minX, minY, maxX, maxY } = this.getElementBoundary(element);
    
    switch (element.type) {
        case "rect":
        case "circle":
        case "pencil":
            this.ctx.strokeRect(minX - 5, minY - 5, maxX - minX + 10, maxY - minY + 10);
            break;
            
        case "line":
        case "arrow": {
            this.ctx.beginPath();
            this.ctx.lineWidth = 3;
            this.ctx.moveTo(element.startingPoint.x, element.startingPoint.y);
            this.ctx.lineTo(element.endingPoint.x, element.endingPoint.y);
            this.ctx.stroke();

            break;
        }
    }
    
    this.ctx.restore();
    if (this.currentTool === "selection") {
        this.drawResizeHandles(element);
    }
  }

  private handleMouseDown = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    this.isDrawing = true;

    if (this.currentTool == "pan") {
        this.isPanning = true;
        this.panStart.x = event.clientX;
        this.panStart.y = event.clientY;
        document.body.style.cursor = "grabbing";
        return;
    }
    const result = this.screenToCanvas(event.clientX,event.clientY);
    const canvasX = result.clientX;
    const canvasY = result.clientY;
    this.redraw();
    if (
      ["line", "rect", "circle", "pencil", "arrow"].includes(this.currentTool)
    ) {
      this.startX = canvasX;
      this.startY = canvasY;
    } else if (this.currentTool == "eraser") {
        this.isErasing = true;
        this.createEraserCursor(canvasX, canvasY);
    } else if (this.currentTool == "selection") {
        if(this.selectedElementIndex !== null) {
            const element = this.elements[this.selectedElementIndex];
            switch (element?.type) {
                case "arrow":
                case "line":
                    if(this.isLineNearPoint(element.startingPoint.x,element.startingPoint.y, element.endingPoint.x, element.endingPoint.y, canvasX, canvasY ,10)){
                        this.isDragging = true;
                        this.dragStartX = canvasX;
                        this.dragStartY = canvasY;
                        this.elementStartPosition = this.cloneElementPosition(element!);
                        document.body.style.cursor = "move";
                    }
                break;
                case "circle":
                case "pencil":
                case "rect":
                    if (this.isPointInsideElement(element!, canvasX, canvasY)) {                    
                        this.isDragging = true;
                        this.dragStartX = canvasX;
                        this.dragStartY = canvasY;
                        this.elementStartPosition = this.cloneElementPosition(element!);
                        document.body.style.cursor = "move";
                    }
                break;
            }
            return;
        } else {
            let foundElement = false;
            if(!foundElement && this.elements.length > 0){
                for (let i = this.elements.length - 1; i >= 0; i--) {
                    const element = this.elements[i];
                    if (this.isElementUnderEraser(element!, canvasX, canvasY, 10)) {
                        this.selectedElementIndex = i;
                        foundElement = true;
                        break;
                    }
                }
            }
        
            if (!foundElement) {
                this.selectedElementIndex = null;
            }
            this.redraw();
            return;
        }
    } else {
        this.isDrawing = false;
    }
    this.selectedElementIndex = null;
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
    circle: Shape
  ): boolean {
    if (circle.type !== "circle") return false;
    
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
    switch (updatedElement.type) {
        case "rect":
            updatedElement.x = this.elementStartPosition.x + deltaX;
            updatedElement.y = this.elementStartPosition.y + deltaY;
        break;
        case "circle":
            updatedElement.centerX = this.elementStartPosition.centerX + deltaX;
            updatedElement.centerY = this.elementStartPosition.centerY + deltaY;
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
            updatedElement.points = this.elementStartPosition.points.map((p: Point) => ({
            x: p.x + deltaX,
            y: p.y + deltaY
            }));
        break;
    }
    
    return updatedElement;
  }

  private handleMouseUp = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (!this.isDrawing) return;

    if(this.currentTool == "pan" && this.isPanning) {
        this.isPanning = false;
        document.body.style.cursor = "default";
        this.isDrawing = false;
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
        centerX: (canvasX - this.startX) / 2 + this.startX,
        centerY: (canvasY - this.startY) / 2 + this.startY,
        radius: {
          x: Math.abs((canvasX - this.startX) / 2),
          y: Math.abs((canvasY - this.startY) / 2),
        },
      }
    } else if (this.currentTool == "pencil") {
      shape = {
        type: "pencil",
        points: this.points,
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
    this.isDrawing = false;
    this.redraw();
  };

  private handleMouseMove = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (!this.isDrawing) return;
    if (!this.ctx) return;

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
    
    this.redraw();
    if (this.currentTool == "line") {
      this.ctx.beginPath();
      this.ctx.moveTo(this.startX, this.startY);
      this.ctx.lineTo(canvasX, canvasY);
      this.ctx.strokeStyle = "#fff";
      this.ctx.stroke();
    } else if (this.currentTool == "rect") {
      this.ctx?.strokeRect(
        this.startX,
        this.startY,
        canvasX - this.startX,
        canvasY - this.startY
      );
    } else if (this.currentTool == "circle") {
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
    } else if (this.currentTool == "pencil") {
      this.points.push({ x: canvasX, y: canvasY });
      this.ctx.beginPath();
      for (const point of this.points) {
        this.ctx.lineTo(point.x, point.y);
        this.ctx.stroke();
      }
    } else if (this.currentTool == "arrow") {
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
    } else if (this.currentTool == "eraser" && this.isErasing) {
        this.createEraserCursor(canvasX, canvasY);
        this.eraseAtPosition(canvasX, canvasY);
    }
  };


  public setTool = (tool: Tool) => {
    this.selectedElementIndex = null;
    this.currentTool = tool;
    if (tool !== "eraser") {
        document.body.style.cursor = "default";
    }
  };

  

  private redraw = () => {
    if (!this.ctx || !this.canvas) return;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = "#fff";
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([]);

    this.ctx.setTransform(this.zoom,0,0,this.zoom,this.panOffset.x, this.panOffset.y);

    this.elements.forEach((element: Shape) => {
      switch (element.type) {
        case "line":
          this.ctx?.beginPath();
          this.ctx?.moveTo(element.startingPoint.x, element.startingPoint.y);
          this.ctx?.lineTo(element.endingPoint.x, element.endingPoint.y);
          this.ctx?.stroke();
          break;
        case "rect":
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
            element.centerX,
            element.centerY,
            Math.abs(element.radius.x),
            Math.abs(element.radius.y),
            0,
            0,
            2 * Math.PI,
            true
          );
          this.ctx?.stroke();
          break;
        case "pencil":
          this.ctx?.beginPath();
          if (element.points.length > 0) {
            this.ctx?.moveTo(element.points[0]!.x, element.points[0]!.y);
            for (const point of element.points) {
              this.ctx?.lineTo(point.x, point.y);
              this.ctx?.stroke();
            }
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
      }
    });
    if (this.selectedElementIndex !== null && this.elements[this.selectedElementIndex]) {
        this.drawSelectionBoundary(this.elements[this.selectedElementIndex]!);   
    }
  };

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
  };
}
