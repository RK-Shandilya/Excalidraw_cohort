"use client";

import { WS_URL } from "@/config";
import { useEffect, useState } from "react";
import Canvas from "./Canvas";

export function RoomCanvas({roomId}: {roomId: string}) {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}?token=${localStorage.getItem("token")}`);

        ws.onopen = () => {
            setSocket(ws);
            const data = JSON.stringify({
                type: "joinRoom",
                roomId
            });
            ws.send(data)
        }

        ws.onerror = (event) => {
            console.log("onerror", event);
        }

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
            setSocket(null);
        };
        
    }, [roomId])
   
    if (!socket) {
        return <div>
            Connecting to server....
        </div>
    }

    return <div className="w-screen h-screen overflow-hidden">
        <Canvas roomId={roomId} socket={socket} />
    </div>
}