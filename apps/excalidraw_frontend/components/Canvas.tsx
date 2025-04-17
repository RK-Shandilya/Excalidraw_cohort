import React, { useEffect, useRef, useState } from 'react'
import { Shape, Tool } from '@/draw/types/types';
import { Topbar } from './Topbar';
import { Game } from '@/draw/Game';
import SideBar from './Sidebar';

const Canvas = ({roomId, socket}:{
    socket: WebSocket,
    roomId: string
}) => {
    const [selectedTool, setSelectedTool] = useState<Tool>("selection");
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [game, setGame] = useState<Game>();
    const [selectedElement, setSelectedElement] = useState<Shape | null>(null);

    const clearSelectionAndSidebar = () => {
        setSelectedElement(null);
        if (selectedTool !== "selection" && selectedTool !== "pan") {
            setSelectedTool("selection");
            game?.setTool("selection");
        }
    };

    useEffect(() => {
        game?.setTool(selectedTool);
    }, [selectedTool,game]);

    useEffect(()=>{
        if(canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);
            g.redraw();
            
            g.onSelectionChange((element: Shape | null) => {
                setSelectedElement(element ? { ...element } : null);
            });
            
            return ()=>{
                g.destroy();
            }
        }
    },[])

  return (
    <div>
        <canvas ref={canvasRef} width={innerWidth} height={innerHeight} className='bg-black'></canvas>
        <Topbar selectedTool={selectedTool} 
        setSelectedTool={(tool: Tool)=>{
            setSelectedTool(tool);
        }}/>

        {selectedElement && (
          <SideBar
            selectedTool={selectedTool}
            selectedElement={selectedElement}
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
            onClose={clearSelectionAndSidebar}
          />
        )}
    </div>
  )
}

export default Canvas