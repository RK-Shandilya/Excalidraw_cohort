import React from "react";
import { ExcalidrawElement } from "@/draw/types/types";

interface ColorButtonProps {
  color: string;
  isSelected: boolean;
  onClick: () => void;
}

export interface SidebarProps {
  selectedElement: ExcalidrawElement; // Replace 'any' with your element type
  selectedTool: string;
  onClose: () => void;
}

export const ColorButton: React.FC<ColorButtonProps> = ({ color, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-6 h-6 rounded-full border-2 ${isSelected ? "border-white" : "border-transparent"}`}
      style={{ backgroundColor: color }}
      aria-label={`Select color ${color}`}
    />
  );
};

interface PropertyButtonProps {
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const PropertyButton: React.FC<PropertyButtonProps> = ({ isSelected, onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className={`p-1 rounded-md ${isSelected ? "bg-blue-500" : "bg-gray-600"} hover:bg-blue-600 transition-colors`}
    >
      {children}
    </button>
  );
};

interface PropertySectionProps {
  title: string;
  show: boolean;
  children: React.ReactNode;
}

export const PropertySection: React.FC<PropertySectionProps> = ({ title, show, children }) => {
  if (!show) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
};