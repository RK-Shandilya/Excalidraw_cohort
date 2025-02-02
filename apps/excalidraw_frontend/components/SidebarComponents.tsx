import React from 'react';

// Props for ColorButton
interface ColorButtonProps {
  color: string;
  isSelected: boolean;
  onClick: () => void;
}

// ColorButton component for selecting colors
export const ColorButton: React.FC<ColorButtonProps> = ({ color, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-6 h-6 rounded-full border-2 ${isSelected ? 'border-white' : 'border-transparent'}`}
      style={{ backgroundColor: color }}
      aria-label={`Select color ${color}`}
    />
  );
};

// Props for PropertyButton
interface PropertyButtonProps {
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

// PropertyButton component for selecting properties (e.g., stroke width, style)
export const PropertyButton: React.FC<PropertyButtonProps> = ({ isSelected, onClick, children }) => {
  return (
    <button
      
      onClick={onClick}
      className={`p-1 rounded-md ${isSelected ? 'bg-blue-500' : 'bg-gray-600'} hover:bg-blue-600 transition-colors`}
    >
      {children}
    </button>
  );
};

// Props for PropertySection
interface PropertySectionProps {
  title: string;
  show: boolean;
  children: React.ReactNode;
}

// PropertySection component for grouping related properties
export const PropertySection: React.FC<PropertySectionProps> = ({ title, show, children }) => {
  if (!show) return null;

  return (
    <div className="space-y-2" >
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
};