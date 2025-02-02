export type Point = {
  x: number;
  y: number;
};

export type Viewport = {
  offset: Point;
  zoom: number;
};

export type Tool =  "selection" | "rect" | "circle" | "line" | "pencil" | "arrow" | "text" | "eraser" | "pan"

export type ExcalidrawElement = {
  id: string;
  type: Tool;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: "solid" | "hachure";
  strokeWidth: number;
  roughness: number;
  opacity: number;
  points?: Point[];
  isDeleted?: boolean;
  // Add text-specific properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  strokeStyle?: "solid" | "dashed" | "dotted";
  isEraser?: boolean;
};

export type AppState = {
  currentTool: Tool;
  draggingElement: ExcalidrawElement | null;
  selectedElements: ExcalidrawElement[];
  isResizing: boolean;
  isRotating: boolean;
  isPanning: boolean;
  startBoundingBox: { x: number; y: number; width: number; height: number } | null;
};