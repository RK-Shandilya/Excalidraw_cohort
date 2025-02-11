import { useEffect, useRef, useState } from "react";
import { Game } from "@/draw/Game";
import { Topbar } from "./Topbar";
import Sidebar from "./Sidebar";
import { ExcalidrawElement, Tool } from "@/draw/types/types";
import { UndoRedoManager } from "@/draw/managers/UndoRedoManager";
import SelectionBox from "./SelectionBox";
import { update } from "lodash";

export function Canvas({
  roomId,
  socket,
}: {
  socket: WebSocket;
  roomId: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>("selection");
  const [selectedElement, setSelectedElement] = useState<ExcalidrawElement | null>(null);
  const [selectionBounds, setSelectionBounds] = useState<any>(null);
  const [camera, setCamera] = useState<any>(null);
  const [undoRedoManager] = useState(new UndoRedoManager());

  const clearSelectionAndSidebar = () => {
    setSelectedElement(null);
    setSelectionBounds(null);
    gameRef.current?.clearSelection();
    if (selectedTool !== "selection" && selectedTool !== "pan") {
      setSelectedTool("selection");
      gameRef.current?.setTool("selection");
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        gameRef.current?.render();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const game = new Game(canvas, roomId, socket);
      gameRef.current = game;
      const camera = game.getCamera();
      setCamera(camera); // Store the camera in state
      game.render();

      game.onSelectionChange((element: ExcalidrawElement) => {
        const singleElement = Array.isArray(element) ? element[0] : element;

        setSelectedElement(singleElement);
        if (element && gameRef.current) {
          const bounds = gameRef.current.renderSelectionBox();
          setSelectionBounds(bounds);
        } else {
          setSelectionBounds(null);
        }
      });

      game.onElementUpdate((elements: any) => {
        undoRedoManager.pushState(elements);
      });

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey) {
          switch (e.key) {
            case "z":
              e.preventDefault();
              const undoState = undoRedoManager.undo();
              if (undoState) game.setElements(undoState);
              break;
            case "y":
              e.preventDefault();
              const redoState = undoRedoManager.redo();
              if (redoState) game.setElements(redoState);
              break;
          }
        }

        if (e.key === "Escape") clearSelectionAndSidebar();
      };

      const handleCanvasClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const isCanvasClick = target.tagName.toLowerCase() === "canvas";
        if (isCanvasClick && !game.isClickingElement(e)) {
          clearSelectionAndSidebar();
        }
      };

      const handleGlobalClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const isCanvasOrChild = canvas.contains(target);
        const isRotationHandle = target.closest("[data-rotation-handle]") !== null;
        const isSelectionBox = target.closest("[data-selection-box]") !== null;
        const isSidebar = target.closest(".sidebar") !== null;
        const isTopbar = target.closest(".topbar") !== null;

        if (
          !isCanvasOrChild &&
          !isRotationHandle &&
          !isSelectionBox &&
          !isSidebar &&
          !isTopbar
        ) {
          clearSelectionAndSidebar();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("click", handleGlobalClick);
      canvas.addEventListener("click", handleCanvasClick);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("click", handleGlobalClick);
        canvas.removeEventListener("click", handleCanvasClick);
        game.destroy();
      };
    }
  }, [roomId, socket]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <canvas ref={canvasRef} className="absolute top-0 left-0 bg-white" />
      {selectionBounds && selectedElement && (
        <SelectionBox
          element={selectedElement}
          bounds={selectionBounds.screenBounds}
          zoom={camera?.getScale()}
          onResize={(x, y, width, height) => {
            if (gameRef.current && selectedElement) {
              // Convert screen coordinates (x, y) to world coordinates
              const worldPoint = gameRef.current.getCamera().screenToWorld({ x, y });
          
              // Normalize the element's dimensions (handle negative width/height)
              let normalizedX = worldPoint.x;
              let normalizedY = worldPoint.y;
              let normalizedWidth = width;
              let normalizedHeight = height;
          
              if (width < 0) {
                normalizedX += width; // Adjust x if width is negative
                normalizedWidth = Math.abs(width);
              }
              if (height < 0) {
                normalizedY += height; // Adjust y if height is negative
                normalizedHeight = Math.abs(height);
              }
          
              const updatedElement = {
                ...selectedElement,
                x: normalizedX, // Normalized world coordinates
                y: normalizedY, // Normalized world coordinates
                width: normalizedWidth, // Normalized width
                height: normalizedHeight, // Normalized height
              };

              console.log("Updated Element:", updatedElement);
          
              // Update the element in the scene
              gameRef.current.scene.updateElement(updatedElement);
          
              // Recalculate selection bounds after resizing
              const newBounds = gameRef.current.renderSelectionBox();
              console.log("New Selection Bounds:", newBounds);
              setSelectionBounds(newBounds);
          
              // Force a re-render
              gameRef.current.render();
            }
          }}
          
          onRotate={(angle) => {
            if (gameRef.current && selectedElement) {
              // Compute the center **before rotation**
              const centerX = selectedElement.x + selectedElement.width / 2;
              const centerY = selectedElement.y + selectedElement.height / 2;
          
              // Update only the angle while keeping center fixed
              const updatedElement = {
                ...selectedElement,
                angle,
                x: centerX - selectedElement.width / 2,
                y: centerY - selectedElement.height / 2,
              };
          
              console.log("Updated Element (Correct Rotation):", updatedElement);
          
              gameRef.current.scene.updateElement(updatedElement);
              const newBounds = gameRef.current.renderSelectionBox();
              setSelectionBounds(newBounds);
              gameRef.current.render();
            }
          }}                   
        />
      )}
      <Topbar
        selectedTool={selectedTool}
        setSelectedTool={(tool) => {
          setSelectedTool(tool);
          gameRef.current?.setTool(tool);

          if (tool !== "pan") {
            gameRef.current?.setPanning(false);
          }

          if (tool !== "selection") {
            setSelectedElement(null);
            setSelectionBounds(null);
          }
        }}
      />
      <Sidebar
        selectedTool={selectedTool}
        selectedElement={selectedElement}
        onClose={clearSelectionAndSidebar}
        setFontSize={(size) => gameRef.current?.setFontSize(size)}
        setFontFamily={(family) => gameRef.current?.setFontFamily(family)}
        setTextAlign={(align) => gameRef.current?.setTextAlign(align)}
        setStrokeColor={(color) => gameRef.current?.setStrokeColor(color)}
        setFillColor={(color) => gameRef.current?.setFillColor(color)}
        setStrokeWidth={(width) => gameRef.current?.setStrokeWidth(width)}
        setOpacity={(opacity) => gameRef.current?.setOpacity(opacity)}
        setStrokeStyle={(style) =>
          gameRef.current?.setStrokeStyle(style as "solid" | "dashed" | "dotted")
        }
        resetCamera={() => gameRef.current?.resetCamera()}
      />
    </div>
  );
}