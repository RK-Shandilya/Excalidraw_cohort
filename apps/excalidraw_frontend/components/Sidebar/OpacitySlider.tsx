import React from "react";
import { ExcalidrawElement } from "@/draw/types/types";

interface OpacitySliderProps {
  selectedElement: ExcalidrawElement | null;
  onChange: (opacity: number) => void;
}

export const OpacitySlider: React.FC<OpacitySliderProps> = ({ selectedElement, onChange }) => {
  const opacity = selectedElement?.opacity ?? 1;

  return (
    <input
      type="range"
      min="0"
      max="100"
      value={opacity * 100}
      onChange={(e) => onChange(Number(e.target.value) / 100)}
      className="w-full accent-blue-500"
    />
  );
};