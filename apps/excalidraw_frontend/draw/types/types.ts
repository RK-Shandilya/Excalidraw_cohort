export type Point = {
  x: number;
  y: number;
};

export type Tool = "selection" | "rect" | "circle" | "line" | "arrow" | "pencil" | "text" | "pan" | "eraser";

export type Shape = {
  type: string;
} & (
  | {
        type: "rect" | "circle";
        x: number;
        y: number;
        width: number;
        height: number;
        rotation?: number;
        strokeStyle?: string;
        strokeColor? : string;
        strokeWidth?: number;
        fillColor?: string;
        opacity?: number;
    }
    | {
      type: "circle",
      x: number;
        y: number;
        width: number;
        height: number;
        rotation?: number;
        strokeStyle?: string;
        strokeColor? : string;
        strokeWidth?: number;
        fillColor?: string;
        opacity?: number;
    }
  | {
        type: "line";
        startingPoint: Point;
        endingPoint: Point;
        strokeStyle?: string;
        strokeColor? : string;
        strokeWidth?: number;
        opacity?: number;
        fillColor?: string
    }
  | {
      type: "arrow"
      startingPoint: Point;
      endingPoint: Point;
      strokeStyle?: string;
        strokeColor? : string;
        strokeWidth?: number;
        opacity?: number;
        fillColor?: string
  }
  | {
        type: "pencil";
        points: Point[];
        x: number;
        y: number;
        width: number;
        height: number;
        rotation?: number;
        strokeStyle?: string;
        strokeColor? : string;
        strokeWidth?: number;
        opacity?: number;
        fillColor?: string
    }
  | {
      type: "text";
      x: number;
      y: number;
      width: number;
      height: number;
      content: string;
      fontSize: number;
      fontFamily: string;
      maxWidth: number
      strokeStyle?: string;
      strokeColor? : string;
      strokeWidth?: number;
      opacity?: number;
      fillColor?: string
      textAlign? :string;
  }
);