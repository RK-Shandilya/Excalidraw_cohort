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
    }
  | {
        type: "line";
        startingPoint: Point;
        endingPoint: Point;
    }
  | {
        type: "arrow";
        startingPoint: Point;
        endingPoint: Point;
    }
  | {
        type: "text";
        text: string;
        x: number;
        y: number;
    }
  | {
        type: "pencil";
        points: Point[];
        x: number;
        y: number;
        width: number;
        height: number;
    }
);