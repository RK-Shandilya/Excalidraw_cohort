import { ExcalidrawElement } from "../types";

export class TextRenderer {
  constructor(private ctx: CanvasRenderingContext2D) {}

  renderText(element: ExcalidrawElement) {
    if (!element.text) return;
  
    const fontSize = element.fontSize || 20;
    const fontFamily = element.fontFamily || 'Arial';
    
    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = (element.textAlign || 'left') as CanvasTextAlign;
    this.ctx.fillStyle = element.strokeColor || "#000000";
    this.ctx.fillText(element.text, element.x, element.y);
  }
}