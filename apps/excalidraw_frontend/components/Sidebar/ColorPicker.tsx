import React from "react";
import { ColorButton } from "../SidebarComponents";
import { ExcalidrawElement } from "@/draw/types/types";

interface ColorPickerProps {
  selectedElement: ExcalidrawElement | null;
  onChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ selectedElement, onChange }) => {
  const colors = [
    "#000000", // Black
    "#ff0000", // Red
    "#00ff00", // Green
    "#0000ff", // Blue
    "#ffff00", // Yellow
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