
  
  export interface ElementStyles {
    strokeColor: string;
    backgroundColor: string;
    fillStyle: "solid" | "hachure" | "cross-hatch";
    strokeWidth: number;
    roughness: number;
    opacity: number;
  }
  
  export interface ElementBounds {
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number;
  }
  