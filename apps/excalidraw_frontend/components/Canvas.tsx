import { useEffect, useRef, useState } from "react";
import { Game } from "@/draw/Game";
import { Topbar } from "./Topbar";
import Sidebar from "./Sidebar";

export type Tool = "rect" | "circle" | "pencil" | "line" | "selection" | "text" | "pan" | "arrow" | "eraser";

export function Canvas({
    roomId,
    socket
}: {
    socket: WebSocket;
    roomId: string;
}) {

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game, setGame] = useState<Game>();
    const [selectedTool, setSelectedTool] = useState<Tool>("selection");

    useEffect(() => {
        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);

            return () => {
                g.destroy();
            };
        }
    }, [ roomId, socket]);

    return (
        <div style={{ height: "100vh", overflow: "hidden" }}>
            <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight}></canvas>
            <Topbar selectedTool={selectedTool} setSelectedTool={(tool) => {
                setSelectedTool(tool);
                game?.setTool(tool);
            }} />
            <Sidebar
                selectedElement={game?.getSelectedElement() ?? null}
                setFontSize={(size) => game?.setFontSize(size)}
                setFontFamily={(family) => game?.setFontFamily(family)}
                setTextAlign={(align) => game?.setTextAlign(align)}
                setStrokeColor={(color) => game?.setStrokeColor(color)}
                setFillColor={(color) => game?.setFillColor(color)}
                setStrokeWidth={(width) => game?.setStrokeWidth(width)}
                setOpacity={(opacity) => game?.setOpacity(opacity)}
                setStrokeStyle={(style) => game?.setStrokeStyle(style)}
                setSloppiness={(level) => game?.setSloppiness(level)}
                setEdges={(edges) => game?.setEdges(edges)}
            />
        </div>
    );
}