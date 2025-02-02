import { useEffect, useRef, useState, useCallback } from "react";
import { Game } from "@/draw/Game";
import { Topbar } from "./Topbar";
import Sidebar from "./Sidebar";
import { ExcalidrawElement } from "@/draw/types";
import { UndoRedoManager } from "@/draw/UndoRedoManager";
import { Tool } from "@/draw/types";
import SelectionBox from "@/draw/Selection/SelectionBox";

export function Canvas({
  roomId,
  socket,
}: {
  socket: WebSocket;
  roomId: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<Game>();
  const [selectedTool, setSelectedTool] = useState<Tool>("selection");
  const [selectedElement, setSelectedElement] =
    useState<ExcalidrawElement | null>(null);
  const [undoRedoManager] = useState(new UndoRedoManager());
  const [selectionBounds, setSelectionBounds] = useState<any>(null);

  // Combined function to clear selection and sidebar
  const clearSelectionAndSidebar = () => {
    setSelectedElement(null);
    setSelectionBounds(null);
    game?.clearSelection();
    if (selectedTool !== "selection" && selectedTool !== "pan") {
      setSelectedTool("selection");
      game?.setTool("selection");
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        game?.render();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [game]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;

      const g = new Game(canvasRef.current, roomId, socket);
      setGame(g);
      g.render();

      g.onSelectionChange((element) => {
        if (element?.id !== selectedElement?.id) {
          setSelectedElement(element);
          if (element) {
            setSelectionBounds(g.renderSelectionBox());
          } else {
            setSelectionBounds(null);
          }
        }
      });

      g.onElementUpdate((elements) => {
        undoRedoManager.pushState(elements);
      });

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey) {
          switch (e.key) {
            case "z":
              e.preventDefault();
              const undoState = undoRedoManager.undo();
              if (undoState) g.setElements(undoState);
              break;
            case "y":
              e.preventDefault();
              const redoState = undoRedoManager.redo();
              if (redoState) g.setElements(redoState);
              break;
          }
        }

        if (e.key === "Escape") {
          clearSelectionAndSidebar();
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      const handleCanvasClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const isCanvasClick = target.tagName.toLowerCase() === "canvas";
      
        // Clear selection only if clicking on empty canvas area
        if (isCanvasClick && !game?.isClickingElement(e)) {
          clearSelectionAndSidebar();
        }
      };

      const handleGlobalClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const isCanvasOrChild = canvasRef.current?.contains(target);
        const isRotationHandle = target.closest("[data-rotation-handle]") !== null;
        const isSelectionBox = target.closest("[data-selection-box]") !== null;
        const isSidebar = target.closest(".sidebar") !== null;
        const isTopbar = target.closest(".topbar") !== null;
      
        // If clicking outside any interactive elements
        if (!isCanvasOrChild && !isRotationHandle && !isSelectionBox && !isSidebar && !isTopbar) {
          clearSelectionAndSidebar();
        }
      };

      // Add click handlers
      window.addEventListener("click", handleGlobalClick);
      canvasRef.current.addEventListener("click", handleCanvasClick);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("click", handleGlobalClick);
        canvasRef.current?.removeEventListener("click", handleCanvasClick);
        g.destroy();
      };
    }
  }, [roomId, socket, undoRedoManager]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 bg-white"
      />
      {selectionBounds && selectedElement && (
        <SelectionBox
          element={selectionBounds.element}
          bounds={selectionBounds.screenBounds}
          onResize={(width, height) => {
            if (game && selectedElement) {
              const updatedElement = {
                ...selectedElement,
                width,
                height,
              };
              game.scene.updateElement(updatedElement);
              game.render();
              setSelectionBounds(game.renderSelectionBox());
            }
          }}
          onRotate={(angle: number) => {
            if (game && selectedElement) {
              const updatedElement = {
                ...selectedElement,
                angle,
              };
              game.scene.updateElement(updatedElement);
              game.render();
              setSelectionBounds(game.renderSelectionBox());
            }
          }}
        />
      )}
      <Topbar
        selectedTool={selectedTool}
        setSelectedTool={(tool) => {
          setSelectedTool(tool);
          game?.setTool(tool);
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
        setFontSize={(size) => game?.setFontSize(size)}
        setFontFamily={(family) => game?.setFontFamily(family)}
        setTextAlign={(align) => game?.setTextAlign(align)}
        setStrokeColor={(color) => game?.setStrokeColor(color)}
        setFillColor={(color) => game?.setFillColor(color)}
        setStrokeWidth={(width) => game?.setStrokeWidth(width)}
        setOpacity={(opacity) => game?.setOpacity(opacity)}
        setStrokeStyle={(style) =>
          game?.setStrokeStyle(style as "solid" | "dashed" | "dotted")
        }
        resetCamera={() => game?.resetCamera()}
      />
    </div>
  );
}