import React, { useState } from 'react';

interface ColorProps {
    color: string;
    isSelected: boolean;
    onClick: () => void;
}

interface SidebarProps {
    selectedElement: {
        type: string;
        properties: any;
    } | null;
    setStrokeColor: (color: string) => void;
    setFillColor: (color: string) => void;
    setStrokeWidth: (width: number) => void;
    setOpacity: (opacity: number) => void;
    setStrokeStyle: (style: string) => void;
    setSloppiness: (level: number) => void;
    setEdges: (edges: string) => void;
    setFontSize: (size: number) => void;
    setFontFamily: (family: string) => void;
    setTextAlign: (align: 'left' | 'center' | 'right') => void;
}

const ColorButton = ({ color, isSelected, onClick }: ColorProps) => (
    <button
        onClick={onClick}
        className={`w-6 h-6 rounded-full ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        style={{
            backgroundColor: color,
            border: color === '#ffffff' ? '1px solid #4a4a4a' : 'none'
        }}
    />
);

const PropertyButton = ({ children, isSelected, onClick }: { children: React.ReactNode, isSelected: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`w-8 h-8 rounded-md flex items-center justify-center
        ${isSelected ? 'bg-blue-500' : 'bg-gray-200'} 
        hover:bg-gray-300 transition-colors`}
    >
        {children}
    </button>
);

const PropertySection = ({ title, children, show = true }: { title: string, children: React.ReactNode, show?: boolean }) => {
    if (!show) return null;
    return (
        <div className="space-y-2">
            <h3 className="text-sm font-medium">{title}</h3>
            <div className="flex gap-2 flex-wrap">
                {children}
            </div>
        </div>
    );
};

const Sidebar = ({ 
    selectedElement,
    setStrokeColor,
    setFillColor,
    setStrokeWidth,
    setOpacity,
    setStrokeStyle,
    setSloppiness,
    setEdges,
    setFontSize,
    setFontFamily,
    setTextAlign
}: SidebarProps) => {
    const [opacity, setOpacityState] = useState(100);
    const [strokeWidth, setStrokeWidthState] = useState(1.5);
    const [strokeStyle, setStrokeStyleState] = useState('solid');
    const [fontSize, setFontSizeState] = useState(20);
    const [fontFamily, setFontFamilyState] = useState('Virgil');
    const [textAlign, setTextAlignState] = useState<'left' | 'center' | 'right'>('left');

    const handleOpacityChange = (value: number) => {
        setOpacityState(value);
        setOpacity(value / 100);
    };

    const handleStrokeStyleChange = (style: string) => {
        setStrokeStyleState(style);
        setStrokeStyle(style);
    };

    const isTextElement = selectedElement?.type === 'text';
    const isShapeElement = selectedElement?.type === 'rectangle' || selectedElement?.type === 'circle';
    const isLineElement = selectedElement?.type === 'line';
    const hasSelection = selectedElement !== null;

    return (
        <div className="fixed left-4 top-14 w-48 h-[34rem] overflow-scroll bg-slate-700 rounded-xl p-4 text-white space-y-6 shadow-lg">
            <h1 className="text-lg font-bold">Properties</h1>
            
            <PropertySection title="Stroke" show={isShapeElement || isLineElement}>
                <div className="flex gap-2">
                    {['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'].map(color => (
                        <ColorButton key={color} color={color} isSelected={selectedElement?.properties.strokeColor === color} onClick={() => setStrokeColor(color)} />
                    ))}
                </div>
            </PropertySection>

            <PropertySection title="Background" show={isShapeElement}>
                <div className="flex gap-2">
                    {['transparent', '#ffcccc', '#ccffcc', '#ccccff', '#ffffcc', '#ffccff'].map(color => (
                        <ColorButton key={color} color={color} isSelected={selectedElement?.properties.fillColor === color} onClick={() => setFillColor(color)} />
                    ))}
                </div>
            </PropertySection>

            <PropertySection title="Stroke width" show={isShapeElement || isLineElement}>
                <div className="flex gap-2">
                    {[0.5, 1, 1.5].map(width => (
                        <PropertyButton key={width} isSelected={strokeWidth === width} onClick={() => setStrokeWidth(width)}>
                            <div className="w-3" style={{ height: `${width}px`, backgroundColor: 'black' }} />
                        </PropertyButton>
                    ))}
                </div>
            </PropertySection>

            <PropertySection title="Stroke style" show={isShapeElement || isLineElement}>
                <div className="flex gap-2">
                    {['solid', 'dashed', 'dotted'].map(style => (
                        <PropertyButton key={style} isSelected={strokeStyle === style} onClick={() => handleStrokeStyleChange(style)}>
                            <div className="w-3 border-t-2 border-black" style={{ borderStyle: style }} />
                        </PropertyButton>
                    ))}
                </div>
            </PropertySection>

            <PropertySection title="Opacity" show={hasSelection}>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={opacity}
                    onChange={(e) => handleOpacityChange(Number(e.target.value))}
                    className="w-full accent-blue-500"
                />
            </PropertySection>

            {isTextElement && (
                <>
                    <PropertySection title="Font Size">
                        <select 
                            value={fontSize} 
                            onChange={(e) => {
                                setFontSizeState(Number(e.target.value));
                                setFontSize(Number(e.target.value));
                            }}
                            className="w-full bg-gray-100 rounded-md p-1 text-sm"
                        >
                            {[16, 20, 24, 28, 32, 36, 40].map(size => (
                                <option key={size} value={size}>{size}px</option>
                            ))}
                        </select>
                    </PropertySection>

                    <PropertySection title="Font Family">
                        <select 
                            value={fontFamily}
                            onChange={(e) => {
                                setFontFamilyState(e.target.value);
                                setFontFamily(e.target.value);
                            }}
                            className="w-full bg-gray-100 rounded-md p-1 text-sm"
                        >
                            {['Virgil', 'Helvetica', 'Arial', 'Cascadia'].map(family => (
                                <option key={family} value={family}>{family}</option>
                            ))}
                        </select>
                    </PropertySection>

                    <PropertySection title="Text Align">
                        <div className="flex gap-2">
                            {['left', 'center', 'right'].map(align => (
                                <PropertyButton key={align} isSelected={textAlign === align} onClick={() => {
                                    setTextAlignState(align as 'left' | 'center' | 'right');
                                    setTextAlign(align as 'left' | 'center' | 'right');
                                }}>
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d={
                                            align === 'left' ? "M3 6h18M3 12h12M3 18h15" :
                                            align === 'center' ? "M3 6h18M6 12h12M4 18h16" :
                                            "M3 6h18M9 12h12M6 18h15"
                                        } strokeWidth="2" />
                                    </svg>
                                </PropertyButton>
                            ))}
                        </div>
                    </PropertySection>
                </>
            )}
        </div>
    );
};

export default Sidebar;