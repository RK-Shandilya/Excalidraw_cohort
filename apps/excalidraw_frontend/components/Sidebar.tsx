import React, { useEffect, useRef, useCallback, memo } from 'react';
import { ExcalidrawElement, Tool } from '@/draw/types/types';
import { ColorButton, PropertyButton, PropertySection } from './SidebarComponents';

export interface SidebarProps {
  selectedElement: ExcalidrawElement | null;
  selectedTool: Tool;
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setOpacity: (opacity: number) => void;
  setStrokeStyle: (style: string) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setTextAlign: (align: 'left' | 'center' | 'right') => void;
  resetCamera: () => void;
  onClose: () => void;
}

const Sidebar = memo(({
  selectedElement,
  selectedTool,
  setStrokeColor,
  setFillColor,
  setStrokeWidth,
  setOpacity,
  setStrokeStyle,
  setFontSize,
  setFontFamily,
  setTextAlign,
  onClose
}: SidebarProps) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isTextElement = selectedElement?.type === 'text';
  const isShapeElement = selectedElement?.type === 'rect' || selectedElement?.type === 'circle';
  const isLineElement = selectedElement?.type === 'line' || selectedElement?.type === 'arrow';
  
  // Show sidebar when either an element is selected or a drawing tool is active
  const isVisible = selectedElement !== null || 
    ['rect', 'circle', 'line', 'arrow', 'text', 'pencil'].includes(selectedTool);

  // Determine which sections to show based on selected tool or element
  const showStrokeSection = isShapeElement || isLineElement || 
    ['rect', 'circle', 'line', 'arrow', 'pencil'].includes(selectedTool);
  const showBackgroundSection = isShapeElement || ['rect', 'circle'].includes(selectedTool);
  const showTextSection = isTextElement || selectedTool === 'text';

  const handleClickOutside = useCallback((event: MouseEvent) => {
    // Check if the click is on the canvas or selection box
    const target = event.target as HTMLElement;
    const isCanvasClick = target.tagName.toLowerCase() === 'canvas';
    const isSelectionBoxClick = target.closest('[data-selection-box]') !== null;

    if (
      sidebarRef.current && 
      !sidebarRef.current.contains(event.target as Node) &&
      selectedElement !== null &&
      !isSelectionBoxClick && // Don't close when clicking selection box
      !isCanvasClick // Don't close when clicking canvas directly
    ) {
      onClose();
    }
  }, [onClose, selectedElement]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  if (!isVisible) return null;

  return (
    <div 
      ref={sidebarRef}
      className={`fixed right-4 top-20 w-72 bg-slate-800 rounded-xl p-4 
        text-white space-y-6 shadow-lg z-50 transition-all duration-200 ease-in-out
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`}
    >
      <h1 className="text-lg font-bold">
        {selectedElement ? 'Element Properties' : 'Tool Properties'}
      </h1>

      {showStrokeSection && (
        <PropertySection title="Stroke" show={true}>
          <div className="flex flex-wrap gap-2">
            {['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'].map((color) => (
              <ColorButton
                key={color}
                color={color}
                isSelected={selectedElement?.strokeColor === color}
                onClick={() => setStrokeColor(color)}
              />
            ))}
          </div>
        </PropertySection>
      )}

      {showBackgroundSection && (
        <PropertySection title="Background" show={true}>
          <div className="flex flex-wrap gap-2">
            {['transparent', '#ffcccc', '#ccffcc', '#ccccff', '#ffffcc', '#ffccff'].map((color) => (
              <ColorButton
                key={color}
                color={color}
                isSelected={selectedElement?.backgroundColor === color}
                onClick={() => setFillColor(color)}
              />
            ))}
          </div>
        </PropertySection>
      )}

      {showStrokeSection && (
        <PropertySection title="Stroke width" show={true}>
          <div className="flex gap-2">
            {[2, 4, 6].map((width) => (
              <PropertyButton
                key={width}
                isSelected={selectedElement?.strokeWidth === width}
                onClick={() => setStrokeWidth(width)}
              >
                <div className="w-8" style={{ height: `${width}px`, backgroundColor: 'white' }} />
              </PropertyButton>
            ))}
          </div>
        </PropertySection>
      )}

      {showStrokeSection && (
        <PropertySection title="Stroke style" show={true}>
          <div className="flex gap-2">
            {['solid', 'dashed', 'dotted'].map((style) => (
              <PropertyButton
                key={style}
                isSelected={selectedElement?.strokeStyle === style}
                onClick={() => setStrokeStyle(style)}
              >
                <div className="w-8 border-t-2 border-white" style={{ borderStyle: style }} />
              </PropertyButton>
            ))}
          </div>
        </PropertySection>
      )}

      <PropertySection title="Opacity" show={isVisible}>
        <input
          type="range"
          min="0"
          max="100"
          value={(selectedElement?.opacity ?? 1) * 100}
          onChange={(e) => setOpacity(Number(e.target.value) / 100)}
          className="w-full accent-blue-500"
        />
      </PropertySection>

      {showTextSection && (
        <>
          <PropertySection title="Font Size" show={true}>
            <select
              value={selectedElement?.fontSize ?? 20}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full bg-gray-700 text-white rounded-md p-2"
            >
              {[16, 20, 24, 28, 32, 36, 40].map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </PropertySection>

          <PropertySection title="Font Family" show={true}>
            <select
              value={selectedElement?.fontFamily ?? 'Arial'}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-md p-2"
            >
              {['Arial', 'Helvetica', 'Times New Roman', 'Courier New'].map((family) => (
                <option key={family} value={family}>
                  {family}
                </option>
              ))}
            </select>
          </PropertySection>

          <PropertySection title="Text Align" show={true}>
            <div className="flex gap-2">
              {['left', 'center', 'right'].map((align) => (
                <PropertyButton
                  key={align}
                  isSelected={selectedElement?.textAlign === align}
                  onClick={() => setTextAlign(align as 'left' | 'center' | 'right')}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      d={
                        align === 'left'
                          ? 'M3 6h18M3 12h12M3 18h15'
                          : align === 'center'
                          ? 'M3 6h18M6 12h12M4 18h16'
                          : 'M3 6h18M9 12h12M6 18h15'
                      }
                      strokeWidth="2"
                    />
                  </svg>
                </PropertyButton>
              ))}
            </div>
          </PropertySection>
        </>
      )}
    </div>
  );
});

export default Sidebar;