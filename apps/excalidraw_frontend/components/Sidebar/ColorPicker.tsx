import React from "react";
import { ColorButton } from "../SidebarComponents";
import { ExcalidrawElement } from "@/draw/types/types";

interface ColorPickerProps {
  selectedElement: ExcalidrawElement | null;
  onChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ selectedElement, onChange }) => {
  const colors = [
    "#000000", 
    "#ff0000", 
    "#00ff00", 
    "#0000ff",
    "#ffff00",
    "#ff00ff", // Magenta
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <ColorButton
          key={color}
          color={color}
          isSelected={selectedElement?.strokeColor === color}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
};