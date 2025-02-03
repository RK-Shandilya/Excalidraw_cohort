import React from "react";
import { PropertyButton } from "../SidebarComponents";
import { ExcalidrawElement } from "@/draw/types/types";
interface StrokeWidthPickerProps {
  selectedElement: ExcalidrawElement | null;
  onChange: (width: number) => void;
}

export const StrokeWidthPicker: React.FC<StrokeWidthPickerProps> = ({ selectedElement, onChange }) => {
  const strokeWidths = [2, 4, 6];

  return (
    <div className="flex gap-2">
      {strokeWidths.map((width) => (
        <PropertyButton
          key={width}
          isSelected={selectedElement?.strokeWidth === width}
          onClick={() => onChange(width)}
        >
          <div className="w-8" style={{ height: `${width}px`, backgroundColor: "white" }} />
        </PropertyButton>
      ))}
    </div>
  );
};