import React from 'react'

export interface Point {
    x: number
    y: number
}

export interface Viewport {
    offset: Point
    zoom: number
}

export class Camera {
    private viewport : Viewport = {
        offset: { x: 0, y: 0 },
        zoom: 1
    }

    private isDragging = false;
    private lastMousePos: Point = {x:0 , y:0};

    constructor(private canvas: HTMLCanvasElement) {
        this.setupEventListeners();
        this.viewport.offset = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
          };
    }

    private setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);

        this.canvas.addEventListener('wheel', this.handleWheel);
    }

    private handleMouseDown(e: MouseEvent) {
        if(e.button ==1 || e.button ==2 ){
            this.isDragging = true;
            this.lastMousePos = { x: e.clientX, y: e.clientY };
        }
    }

    private handleMouseMove(e: MouseEvent) {
        if(!this.isDragging) return;
        const dx = e.clientX - this.lastMousePos.x;
        const dy = e.clientY - this.lastMousePos.y;

        this.viewport.offset.x += dx / this.viewport.zoom;
        this.viewport.offset.y += dy / this.viewport.zoom;

        this.lastMousePos = {x: e.clientX , y: e.clientY};
    }

    private handleMouseUp = () => {
        this.isDragging = false;
    }

    private handleWheel(e: WheelEvent) {
        e.preventDefault();
    
        const zoom = this.viewport.zoom;
        const mouseX = e.clientX - this.canvas.offsetLeft;
        const mouseY = e.clientY - this.canvas.offsetTop;
    
        const worldX = (mouseX - this.viewport.offset.x) / zoom;
        const worldY = (mouseY - this.viewport.offset.y) / zoom;
    
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.viewport.zoom *= zoomFactor;
    
        this.viewport.zoom = Math.min(Math.max(0.1, this.viewport.zoom), 5);
    
        this.viewport.offset.x = mouseX - worldX * this.viewport.zoom;
        this.viewport.offset.y = mouseY - worldY * this.viewport.zoom;
    }

    public pan(dx: number, dy: number) {
        this.viewport.offset.x += dx / this.viewport.zoom;
        this.viewport.offset.y += dy / this.viewport.zoom;
    }

    screenToWorld(screenX: number, screenY: number): Point {
        return {
          x: (screenX - this.viewport.offset.x) / this.viewport.zoom,
          y: (screenY - this.viewport.offset.y) / this.viewport.zoom
        };
    }

    worldToScreen(worldX: number, worldY: number): Point {
        return {
            x: worldX * this.viewport.zoom + this.viewport.offset.x,
            y: worldY * this.viewport.zoom + this.viewport.offset.y
        }
    }

    applyTransform(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.viewport.offset.x, this.viewport.offset.y);
        ctx.scale(this.viewport.zoom, this.viewport.zoom);
    }

    restoreTransform(ctx: CanvasRenderingContext2D) {
        ctx.restore();
    }

    getViewport(): Viewport {
        return this.viewport;
    }

    cleanup() {
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('wheel', this.handleWheel);
    }
}