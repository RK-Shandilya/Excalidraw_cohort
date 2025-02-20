import React, { useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { ExcalidrawElement, Tool } from '@/draw/types/types';

interface SidebarProps {
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

const Sidebar = ({
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
  
  const isVisible = selectedElement !== null || 
    ['rect', 'circle', 'line', 'arrow', 'text', 'pencil'].includes(selectedTool);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const isCanvasClick = target.tagName.toLowerCase() === 'canvas';
    const isSelectionBoxClick = target.closest('[data-selection-box]') !== null;

    if (
      sidebarRef.current && 
      !sidebarRef.current.contains(event.target as Node) &&
      selectedElement !== null &&
      !isSelectionBoxClick &&
      !isCanvasClick
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
      className="fixed right-0 top-0 h-full w-72 bg-white border-l border-gray-200 shadow-lg overflow-y-auto z-50 sidebar"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          {selectedElement ? 'Element Style' : 'Style'}
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Stroke Color */}
        {(isShapeElement || isLineElement || ['rect', 'circle', 'line', 'arrow', 'pencil'].includes(selectedTool)) && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Stroke</label>
            <div className="flex flex-wrap gap-2">
              {['#1e1e1e', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#9c36b5'].map(color => (
                <button
                  key={color}
                  onClick={() => {
                    setStrokeColor(color)
                  }}
                  className={`w-8 h-8 rounded-lg border-2 ${
                    selectedElement?.strokeColor === color 
                      ? 'border-blue-500' 
                      : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Background Color */}
        {(isShapeElement || ['rect', 'circle'].includes(selectedTool)) && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Background</label>
            <div className="flex flex-wrap gap-2">
              {['transparent', '#ffc9c9', '#b2f2bb', '#a5d8ff', '#ffec99', '#eebefa'].map(color => (
                <button
                  key={color}
                  onClick={() => setFillColor(color)}
                  className={`w-8 h-8 rounded-lg border-2 ${
                    selectedElement?.backgroundColor === color 
                      ? 'border-blue-500' 
                      : 'border-gray-200'
                  }`}
                  style={{ 
                    backgroundColor: color,
                    backgroundImage: color === 'transparent' 
                      ? 'linear-gradient(45deg, #efefef 25%, transparent 25%), linear-gradient(-45deg, #efefef 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #efefef 75%), linear-gradient(-45deg, transparent 75%, #efefef 75%)'
                      : 'none',
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stroke Width */}
        {(isShapeElement || isLineElement || ['rect', 'circle', 'line', 'arrow', 'pencil'].includes(selectedTool)) && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Stroke width</label>
            <div className="flex gap-2">
              {[1, 2, 4, 8].map(width => (
                <button
                  key={width}
                  onClick={() => setStrokeWidth(width)}
                  className={`flex items-center justify-center w-12 h-8 rounded-lg ${
                    selectedElement?.strokeWidth === width
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div 
                    className="bg-gray-900 rounded-full"
                    style={{ height: `${width}px`, width: '24px' }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stroke Style */}
        {(isShapeElement || isLineElement || ['rect', 'circle', 'line', 'arrow'].includes(selectedTool)) && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Stroke style</label>
            <div className="flex gap-2">
              {['solid', 'dashed', 'dotted'].map(style => (
                <button
                  key={style}
                  onClick={() => setStrokeStyle(style)}
                  className={`w-12 h-8 rounded-lg flex items-center justify-center ${
                    selectedElement?.strokeStyle === style
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div 
                    className="w-8 border-t-2 border-gray-900"
                    style={{ borderStyle: style }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text Properties */}
        {(isTextElement || selectedTool === 'text') && (
          <>
            {/* Font Family */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Font family</label>
              <select
                value={selectedElement?.fontFamily ?? 'Arial'}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2 px-3"
              >
                {['Arial', 'Helvetica', 'Times New Roman', 'Courier New'].map(family => (
                  <option key={family} value={family}>{family}</option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Font size</label>
              <select
                value={selectedElement?.fontSize ?? 20}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 py-2 px-3"
              >
                {[16, 20, 24, 28, 32, 36, 40].map(size => (
                  <option key={size} value={size}>{size}px</option>
                ))}
              </select>
            </div>

            {/* Text Alignment */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Text align</label>
              <div className="flex gap-2">
                {[
                  { value: 'left', icon: AlignLeft },
                  { value: 'center', icon: AlignCenter },
                  { value: 'right', icon: AlignRight }
                ].map(({ value, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setTextAlign(value as 'left' | 'center' | 'right')}
                    className={`p-2 rounded-lg ${
                      selectedElement?.textAlign === value
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Opacity Slider */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Opacity</label>
          <input
            type="range"
            min="0"
            max="100"
            value={(selectedElement?.opacity ?? 1) * 100}
            onChange={(e) => setOpacity(Number(e.target.value) / 100)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;