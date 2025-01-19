"use client"

import { WS_URL } from "@/config";
import { initDraw } from "@/draw";
import { useEffect, useRef, useState } from "react";

export function Canvas({roomId}: {
    roomId: string
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(()=>{
        const ws = new WebSocket(WS_URL);
        ws.onopen = () => {
            setSocket(ws) ;
        }
    },[])

    useEffect(()=>{
        if(canvasRef.current) {
            initDraw(canvasRef.current, roomId, socket);
        }
        
    },[canvasRef])

    if (socket) {
        return <div>
            Connecting to server....
        </div>
    }

    return (
        <div>
            <canvas ref={canvasRef} width={1000} height={1000} />
        </div>
    )
}