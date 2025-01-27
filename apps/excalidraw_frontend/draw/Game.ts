import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";
import { X } from "lucide-react";

type Shape = {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
} | {
    type: "pencil";
    points: { x: number, y: number }[];
} | {
    type: "line";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export class Game {

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes: Shape[]
    private roomId: string;
    private clicked: boolean;
    private startX = 0;
    private startY = 0;
    private currentPencilPoints: { x: number, y: number }[] = [];
    private selectedTool: Tool = "circle";
    private lineThickness = 2;
    private socket: WebSocket;
    private selectedShape: Shape | null = null;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.existingShapes = [];
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
        this.init();
        this.initHandlers();
        this.initMouseHandlers();
    }
    
    destroy() {
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler)

        this.canvas.removeEventListener("mouseup", this.mouseUpHandler)

        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler)
    }

    setTool(tool: "selection" | "circle" | "pencil" | "rect" | "line" ) {
        this.selectedTool = tool;
    }

    async init() {
        this.existingShapes = await getExistingShapes(this.roomId);
        console.log(this.existingShapes);
        this.clearCanvas();
    }

    initHandlers() {
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type == "chat") {
                const parsedShape = JSON.parse(message.message)
                this.existingShapes.push(parsedShape.shape)
                this.clearCanvas();
            }
        }
    }

    isPointInShape(x: number, y: number, shape: Shape): boolean {
        switch (shape.type) {
            case "rect":
                return x >= shape.x && x <= shape.x + shape.width &&
                       y >= shape.y && y <= shape.y + shape.height;
            case "circle":
                const dx = x - shape.centerX;
                const dy = y - shape.centerY;
                return Math.sqrt(dx * dx + dy * dy) <= shape.radius;
            case "line":
                const lineWidth = 5; // Click tolerance
                const d = this.pointToLineDistance(x, y, shape.startX, shape.startY, shape.endX, shape.endY);
                return d <= lineWidth;
            case "pencil":
                return shape.points.some((point, i) => {
                    if (i === shape.points.length - 1) return false;
                    const nextPoint = shape.points[i + 1];
                    const d = this.pointToLineDistance(x, y, point.x, point.y, nextPoint.x, nextPoint.y);
                    return d <= 5;
                });
        }
    }

    pointToLineDistance(x: number, y: number, x1: number, y1: number, x2: number, y2: number): number {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0)
            param = dot / lenSq;
        
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

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "rgba(0, 0, 0)"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.lineWidth = this.lineThickness;
        this.existingShapes.map((shape) => {
            this.ctx.strokeStyle = shape === this.selectedShape ? "rgba(0, 255, 0)" : "rgba(255, 255, 255)";
            switch (shape.type) {
                case "rect":
                    this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
                    break;
                case "circle":
                    this.ctx.beginPath();
                    this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.closePath();
                    break;
                case "line":
                    this.ctx.beginPath();
                    this.ctx.moveTo(shape.startX, shape.startY);
                    this.ctx.lineTo(shape.endX, shape.endY);
                    this.ctx.stroke();
                    this.ctx.closePath();
                    break;
                case "pencil":
                    if (shape.points.length > 1) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
                        shape.points.slice(1).forEach(point => {
                            this.ctx.lineTo(point.x, point.y);
                        });
                        this.ctx.stroke();
                        this.ctx.closePath();
                    }
                    break;
            }
        })
    }

    mouseDownHandler = (e: MouseEvent) => {
        
        const x = e.pageX - this.canvas.offsetLeft;
        const y = e.pageY - this.canvas.offsetTop;

        if (this.selectedTool === "selection") {
            this.selectedShape = null;
            for (let i = this.existingShapes.length - 1; i >= 0; i--) {
                if (this.isPointInShape(x, y, this.existingShapes[i])) {
                    this.selectedShape = this.existingShapes[i];
                    break;
                }
            }
            this.clearCanvas();
            return;
        }

        this.clicked = true;
        this.startX=x;
        this.startY=y;
        this.ctx.strokeStyle = "rgba(255, 255, 255)";
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        if (this.selectedTool === "pencil") {
            this.currentPencilPoints = [{ x: this.startX, y: this.startY }];
        }
    }
    mouseUpHandler = (e : MouseEvent) => {
        if (!this.clicked) return;
        
        this.clicked = false;
        const x = e.pageX - this.canvas.offsetLeft;
        const y = e.pageY - this.canvas.offsetTop;
        const width = x - this.startX;
        const height = y - this.startY;

        const selectedTool = this.selectedTool;
        let shape: Shape | null = null;
        switch (selectedTool) {
            case "rect":
                shape = {
                    type: "rect",
                    x: this.startX,
                    y: this.startY,
                    height,
                    width
                };
                break;
            case "circle":
                const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
                shape = {
                    type: "circle",
                    radius: radius,
                    centerX: this.startX + (width / 2),
                    centerY: this.startY + (height / 2),
                };
                break;
            case "line":
                shape = {
                    type: "line",
                    startX: this.startX,
                    startY: this.startY,
                    endX: x,
                    endY: y
                };
                break;
            case "pencil":
                // Only create shape if we have multiple points
                if (this.currentPencilPoints.length > 1) {
                    shape = {
                        type: "pencil",
                        points: this.currentPencilPoints
                    };
                }
                break;
        }

        if (shape) {
            this.existingShapes.push(shape);
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({ shape }),
                roomId: this.roomId
            }));
        }

        // Reset pencil points
        this.currentPencilPoints = [];
    }
    mouseMoveHandler = (e: MouseEvent) => {
        if (!this.clicked) return;

        const x = e.pageX - this.canvas.offsetLeft;
        const y = e.pageY - this.canvas.offsetTop;
        const width = x - this.startX;
        const height = y - this.startY;

        this.clearCanvas();

        switch (this.selectedTool) {
            case "rect":
                this.ctx.strokeRect(this.startX, this.startY, width, height);
                break;
            case "circle":
                const radius = Math.sqrt(width ** 2 + height ** 2) / 2;
                const centerX = this.startX + (width / 2);
                const centerY = this.startY + (height / 2);
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();
                break;
            case "line":
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
                this.ctx.closePath();
                break;
            case "pencil":
                // Add current point to pencil points
                this.currentPencilPoints.push({ x, y });

                // Draw the entire current path
                if (this.currentPencilPoints.length > 1) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.currentPencilPoints[0].x, this.currentPencilPoints[0].y);
                    this.currentPencilPoints.slice(1).forEach(point => {
                        this.ctx.lineTo(point.x, point.y);
                    });
                    this.ctx.stroke();
                    this.ctx.closePath();
                }
                break;
        }
    }

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler)

        this.canvas.addEventListener("mouseup", this.mouseUpHandler)

        this.canvas.addEventListener("mousemove", this.mouseMoveHandler)    

    }
}