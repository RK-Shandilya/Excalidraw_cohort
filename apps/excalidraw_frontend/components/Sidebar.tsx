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

  const isTextElement = selectedElement?.type === "text"
  const isShapeElement = selectedElement?.type === "rect" || selectedElement?.type === "circle"
  const isLineElement = selectedElement?.type === "line" || selectedElement?.type === "arrow"

  const shouldShow =
    selectedElement !== null || ["rect", "circle", "line", "arrow", "text", "pencil"].includes(selectedTool)

  useEffect(() => {
    if (shouldShow) {
      // Small delay to trigger animation
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
          return <Square className="h-4 w-4" />
        case "circle":
          return <Circle className="h-4 w-4" />
        case "line":
          return <LineIcon className="h-4 w-4" />
        case "arrow":
          return <ArrowRight className="h-4 w-4" />
        case "text":
          return <Type className="h-4 w-4" />
        case "pencil":
          return <Pencil className="h-4 w-4" />
        default:
          return <Paintbrush className="h-4 w-4" />
      }
    } else {
      switch (selectedTool) {
        case "rect":
          return <Square className="h-4 w-4" />
        case "circle":
          return <Circle className="h-4 w-4" />
        case "line":
          return <LineIcon className="h-4 w-4" />
        case "arrow":
          return <ArrowRight className="h-4 w-4" />
        case "text":
          return <Type className="h-4 w-4" />
        case "pencil":
          return <Pencil className="h-4 w-4" />
        default:
          return <Paintbrush className="h-4 w-4" />
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

  return (
    <div
      ref={sidebarRef}
      className={`fixed right-6 top-6 w-64 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col transition-all duration-300 ease-in-out ${
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20"
      }`}
      style={{ maxHeight: "calc(100vh - 4rem)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-800 bg-opacity-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-indigo-500 bg-opacity-20 text-indigo-400 shadow-sm">
            {getToolIcon()}
          </div>
          <h2 className="text-lg font-medium text-white">{getTitle()}</h2>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>

      <div className="overflow-y-auto">
        <div className="p-5 space-y-6">
          {/* Stroke Color */}
          {(isShapeElement ||
            isLineElement ||
            ["rect", "circle", "line", "arrow", "pencil"].includes(selectedTool)) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Stroke</label>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {["#ffffff", "#3b82f6", "#10b981", "#ef4444"].map((color) => (
                  <button
                    key={color}
                    className={`h-10 w-10 rounded-lg transition-all duration-200 hover:scale-105 ${
                      selectedElement?.strokeColor === color
                        ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-900"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setStrokeColor(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Background Color */}
          {(isShapeElement || ["rect", "circle"].includes(selectedTool)) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Background</label>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {["transparent", "#6366f1", "#a855f7", "#f97316"].map((color) => (
                  <button
                    key={color}
                    className={`h-10 w-10 rounded-lg border border-gray-700 transition-all duration-200 hover:scale-105 ${
                      selectedElement?.backgroundColor === color
                        ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-900"
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
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stroke Width */}
          {(isShapeElement ||
            isLineElement ||
            ["rect", "circle", "line", "arrow", "pencil"].includes(selectedTool)) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Stroke width</label>
                <span className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded-full">
                  {selectedElement?.strokeWidth || 1}px
                </span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 4, 8].map((width) => (
                  <button
                    key={width}
                    className={`flex-1 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
                      selectedElement?.strokeWidth === width
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                    onClick={() => setStrokeWidth(width)}
                  >
                    <div className="bg-current rounded-full" style={{ height: `${width}px`, width: "24px" }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stroke Style */}
          {(isShapeElement || isLineElement || ["rect", "circle", "line", "arrow"].includes(selectedTool)) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Stroke style</label>
              </div>
              <div className="flex gap-2">
                {["solid", "dashed", "dotted"].map((style) => (
                  <button
                    key={style}
                    className={`flex-1 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
                      selectedElement?.strokeStyle === style
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                    onClick={() => setStrokeStyle(style)}
                  >
                    <div className="w-8 border-t-2 border-current" style={{ borderStyle: style }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Text Properties */}
          {(isTextElement || selectedTool === "text") && (
            <>
              <div className="h-px bg-gray-800 my-5" />

              {/* Font Family */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Font family</label>
                <select
                  value={selectedElement?.fontFamily || "Arial"}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full h-10 text-gray-200 px-3 rounded-lg border border-gray-700 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow duration-200"
                >
                  {["Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia", "Verdana"].map((family) => (
                    <option key={family} value={family} style={{ fontFamily: family }}>
                      {family}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">Font size</label>
                  <span className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded-full">
                    {selectedElement?.fontSize || 20}px
                  </span>
                </div>
                <select
                  value={String(selectedElement?.fontSize || 20)}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-10 px-3 text-gray-200 rounded-lg border border-gray-700 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow duration-200"
                >
                  {[16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64].map((size) => (
                    <option key={size} value={String(size)}>
                      {size}px
                    </option>
                  ))}
                </select>
              </div>

              {/* Text Alignment */}
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
                      className={`flex-1 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
                        selectedElement?.textAlign === value
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                      onClick={() => setTextAlign(value as "left" | "center" | "right")}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="h-px bg-gray-800 my-5" />

          {/* Opacity Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Opacity</label>
              <span className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded-full">
                {Math.round((selectedElement?.opacity || 1) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={(selectedElement?.opacity || 1) * 100}
              onChange={(e) => setOpacity(Number(e.target.value) / 100)}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                accentColor: "#6366f1",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SideBar