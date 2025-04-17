"use client"

import { useRef, useCallback, useEffect, useState } from "react"
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Paintbrush,
  Type,
  Square,
  Circle,
  LineChartIcon as LineIcon,
  ArrowRight,
  Pencil,
  X,
  ChevronRight,
} from "lucide-react"

interface SidebarProps {
  selectedElement: any
  selectedTool: string
  setStrokeColor: (color: string) => void
  setFillColor: (color: string) => void
  setStrokeWidth: (width: number) => void
  setOpacity: (opacity: number) => void
  setStrokeStyle: (style: string) => void
  setFontSize: (size: number) => void
  setFontFamily: (family: string) => void
  setTextAlign: (align: "left" | "center" | "right") => void
  onClose: () => void
}

const SideBar = ({
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
  onClose,
}: SidebarProps) => {
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  const isTextElement = selectedElement?.type === "text"
  const isShapeElement = selectedElement?.type === "rect" || selectedElement?.type === "circle"
  const isLineElement = selectedElement?.type === "line" || selectedElement?.type === "arrow"

  const shouldShow =
    selectedElement !== null || ["rect", "circle", "line", "arrow", "text", "pencil"].includes(selectedTool)

  useEffect(() => {
    if (shouldShow) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 50)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [shouldShow])

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const isCanvasClick = target.tagName.toLowerCase() === "canvas"
      const isSelectionBoxClick = target.closest("[data-selection-box]") !== null

      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        selectedElement !== null &&
        !isSelectionBoxClick &&
        !isCanvasClick
      ) {
        onClose()
      }
    },
    [selectedElement, onClose],
  )

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [handleClickOutside])

  if (!shouldShow) return null

  const getToolIcon = () => {
    if (selectedElement) {
      switch (selectedElement.type) {
        case "rect":
          return <Square className="h-5 w-5" />
        case "circle":
          return <Circle className="h-5 w-5" />
        case "line":
          return <LineIcon className="h-5 w-5" />
        case "arrow":
          return <ArrowRight className="h-5 w-5" />
        case "text":
          return <Type className="h-5 w-5" />
        case "pencil":
          return <Pencil className="h-5 w-5" />
        default:
          return <Paintbrush className="h-5 w-5" />
      }
    } else {
      switch (selectedTool) {
        case "rect":
          return <Square className="h-5 w-5" />
        case "circle":
          return <Circle className="h-5 w-5" />
        case "line":
          return <LineIcon className="h-5 w-5" />
        case "arrow":
          return <ArrowRight className="h-5 w-5" />
        case "text":
          return <Type className="h-5 w-5" />
        case "pencil":
          return <Pencil className="h-5 w-5" />
        default:
          return <Paintbrush className="h-5 w-5" />
      }
    }
  }

  const getTitle = () => {
    if (selectedElement) {
      return `${selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} Style`
    } else {
      return `${selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)} Style`
    }
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div
      ref={sidebarRef}
      className={`fixed right-6 top-6 w-64 bg-gray-900/90 backdrop-blur-lg border border-gray-800/70 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col transition-all duration-300 ease-in-out ${
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20"
      }`}
      style={{ 
        maxHeight: "calc(100vh - 4rem)",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)"
      }}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-800/80 bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-500/20 text-indigo-400 shadow-sm group-hover:bg-indigo-500/30 transition-all duration-200">
            {getToolIcon()}
          </div>
          <h2 className="text-lg font-medium text-white">{getTitle()}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleExpand}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-700/70 hover:text-white transition-colors duration-200"
          >
            <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
            <span className="sr-only">Toggle expand</span>
          </button>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-700/70 hover:text-white transition-colors duration-200"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </div>

      <div className={`overflow-y-auto transition-all duration-300 ${isExpanded ? 'max-h-[calc(100vh-8rem)]' : 'max-h-0'}`}>
        <div className="p-5 space-y-6">
          {(isShapeElement ||
            isLineElement ||
            ["rect", "circle", "line", "arrow", "pencil"].includes(selectedTool)) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Stroke</label>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {["#ffffff", "#3b82f6", "#10b981", "#ef4444", "#f97316"].map((color) => (
                  <button
                    key={color}
                    className={`group h-10 w-full rounded-lg transition-all duration-200 hover:scale-105 relative ${
                      selectedElement?.strokeColor === color
                        ? "ring-2 ring-indigo-500 ring-offset-1 ring-offset-gray-900 shadow-md"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setStrokeColor(color)}
                    title={color}
                  >
                    <span className="absolute inset-0 rounded-lg group-hover:bg-white/10 transition-opacity duration-200 opacity-0 group-hover:opacity-100"></span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(isShapeElement || ["rect", "circle"].includes(selectedTool)) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Background</label>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {["transparent", "#6366f1", "#a855f7", "#f97316", "#14b8a6"].map((color) => (
                  <button
                    key={color}
                    className={`group h-10 w-full rounded-lg border border-gray-700/70 transition-all duration-200 hover:scale-105 relative ${
                      selectedElement?.backgroundColor === color
                        ? "ring-2 ring-indigo-500 ring-offset-1 ring-offset-gray-900 shadow-md"
                        : ""
                    }`}
                    style={{
                      backgroundColor: color,
                      backgroundImage:
                        color === "transparent"
                          ? "linear-gradient(45deg, #2d2d2d 25%, transparent 25%), linear-gradient(-45deg, #2d2d2d 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2d2d2d 75%), linear-gradient(-45deg, transparent 75%, #2d2d2d 75%)"
                          : "none",
                      backgroundSize: "8px 8px",
                      backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                    }}
                    onClick={() => setFillColor(color)}
                    title={color === "transparent" ? "Transparent" : color}
                  >
                    <span className="absolute inset-0 rounded-lg group-hover:bg-white/10 transition-opacity duration-200 opacity-0 group-hover:opacity-100"></span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(isShapeElement ||
            isLineElement ||
            ["rect", "circle", "line", "arrow", "pencil"].includes(selectedTool)) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Stroke width</label>
                <span className="text-xs text-gray-300 bg-gray-800/80 px-2.5 py-1.5 rounded-full">
                  {selectedElement?.strokeWidth || 1}px
                </span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 4, 8].map((width) => (
                  <button
                    key={width}
                    className={`group flex-1 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
                      selectedElement?.strokeWidth === width
                        ? "bg-indigo-600/90 text-white shadow-lg shadow-indigo-500/20"
                        : "bg-gray-800/80 text-gray-300 hover:bg-gray-700/80"
                    }`}
                    onClick={() => setStrokeWidth(width)}
                  >
                    <div 
                      className="bg-current rounded-full transition-transform duration-200 group-hover:scale-110" 
                      style={{ height: `${width}px`, width: "24px" }} 
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {(isShapeElement || isLineElement || ["rect", "circle", "line", "arrow"].includes(selectedTool)) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Stroke style</label>
              </div>
              <div className="flex gap-2">
                {["solid", "dashed", "dotted"].map((style) => (
                  <button
                    key={style}
                    className={`group flex-1 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
                      selectedElement?.strokeStyle === style
                        ? "bg-indigo-600/90 text-white shadow-lg shadow-indigo-500/20"
                        : "bg-gray-800/80 text-gray-300 hover:bg-gray-700/80"
                    }`}
                    onClick={() => setStrokeStyle(style)}
                  >
                    <div className="w-8 border-t-2 border-current transition-transform duration-200 group-hover:scale-110" style={{ borderStyle: style }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {(isTextElement || selectedTool === "text") && (
            <>
              <div className="h-px bg-gray-800/80 my-5" />
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Font family</label>
                <select
                  value={selectedElement?.fontFamily || "Arial"}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full h-11 text-gray-200 px-3 rounded-lg border border-gray-700/70 bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-transparent transition-all duration-200 hover:border-gray-600"
                >
                  {["Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia", "Verdana"].map((family) => (
                    <option key={family} value={family} style={{ fontFamily: family }}>
                      {family}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">Font size</label>
                  <span className="text-xs text-gray-300 bg-gray-800/80 px-2.5 py-1.5 rounded-full">
                    {selectedElement?.fontSize || 20}px
                  </span>
                </div>
                <select
                  value={String(selectedElement?.fontSize || 20)}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-11 px-3 text-gray-200 rounded-lg border border-gray-700/70 bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-transparent transition-all duration-200 hover:border-gray-600"
                >
                  {[16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64].map((size) => (
                    <option key={size} value={String(size)}>
                      {size}px
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Text align</label>
                <div className="flex gap-2">
                  {[
                    { value: "left", icon: AlignLeft },
                    { value: "center", icon: AlignCenter },
                    { value: "right", icon: AlignRight },
                  ].map(({ value, icon: Icon }) => (
                    <button
                      key={value}
                      className={`group flex-1 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
                        selectedElement?.textAlign === value
                          ? "bg-indigo-600/90 text-white shadow-lg shadow-indigo-500/20"
                          : "bg-gray-800/80 text-gray-300 hover:bg-gray-700/80"
                      }`}
                      onClick={() => setTextAlign(value as "left" | "center" | "right")}
                    >
                      <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="h-px bg-gray-800/80 my-5" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Opacity</label>
              <span className="text-xs text-gray-300 bg-gray-800/80 px-2.5 py-1.5 rounded-full">
                {Math.round((selectedElement?.opacity || 1) * 100)}%
              </span>
            </div>
            <div className="relative mt-2 px-1">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800/30 to-indigo-600/30 rounded-lg" style={{
                clipPath: `inset(0 ${100 - Math.round((selectedElement?.opacity || 1) * 100)}% 0 0)`,
                transition: "clip-path 0.2s ease"
              }}></div>
              <input
                type="range"
                min="0"
                max="100"
                value={(selectedElement?.opacity || 1) * 100}
                onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                className="w-full h-2 bg-gray-700/80 rounded-lg appearance-none cursor-pointer relative z-10"
                style={{
                  accentColor: "#6366f1",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SideBar