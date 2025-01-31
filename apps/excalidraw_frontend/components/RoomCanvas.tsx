"use client";

import { WS_URL } from "@/config";
import { useEffect, useState } from "react";
import { Canvas } from "./Canvas";

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
            console.log("onopen data",data);
            ws.send(data)
        }

        ws.onerror = (event) => {
            console.log("onerror", event);
        }
        
    }, [])
   
    if (!socket) {
        return <div>
            Connecting to server....
        </div>
    }

    return <div>
        <Canvas roomId={roomId} socket={socket} />
    </div>
}