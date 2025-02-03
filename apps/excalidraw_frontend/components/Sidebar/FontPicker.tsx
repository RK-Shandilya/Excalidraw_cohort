import React from "react";
import { PropertyButton } from "../SidebarComponents";
import { ExcalidrawElement } from "@/draw/types/types";

interface FontPickerProps {
  selectedElement: ExcalidrawElement | null;
  onFontSizeChange: (size: number) => void;
  onFontFamilyChange: (family: string) => void;
  onTextAlignChange: (align: "left" | "center" | "right") => void;
}

export const FontPicker: React.FC<FontPickerProps> = ({
  selectedElement,
  onFontSizeChange,
  onFontFamilyChange,
  onTextAlignChange,
}) => {
  const fontSizes = [16, 20, 24, 28, 32, 36, 40];
  const fontFamilies = ["Arial", "Helvetica", "Times New Roman", "Courier New"];
  const textAlignOptions = ["left", "center", "right"];

  return (
    <>
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Font Size</h2>
        <select
          value={selectedElement?.fontSize ?? 20}
          onChange={(e) => onFontSizeChange(Number(e.target.value))}
          className="w-full bg-gray-700 text-white rounded-md p-2"
        >
          {fontSizes.map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Font Family</h2>
        <select
          value={selectedElement?.fontFamily ?? "Arial"}
          onChange={(e) => onFontFamilyChange(e.target.value)}
          className="w-full bg-gray-700 text-white rounded-md p-2"
        >
          {fontFamilies.map((family) => (
            <option key={family} value={family}>
              {family}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Text Align</h2>
        <div className="flex gap-2">
          {textAlignOptions.map((align) => (
            <PropertyButton
              key={align}
              isSelected={selectedElement?.textAlign === align}
              onClick={() => onTextAlignChange(align as "left" | "center" | "right")}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d={
                    align === "left"
                      ? "M3 6h18M3 12h12M3 18h15"
                      : align === "center"
                      ? "M3 6h18M6 12h12M4 18h16"
                      : "M3 6h18M9 12h12M6 18h15"
                  }
                  strokeWidth="2"
                />
              </svg>
            </PropertyButton>
          ))}
        </div>
      </div>
    </>
  );
};