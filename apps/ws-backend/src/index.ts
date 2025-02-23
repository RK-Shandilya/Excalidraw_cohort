import WebSocket from 'ws'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '@repo/backend-common/config'
const wss = new WebSocket.Server({ port: 8080 })
 
interface User {
    ws : WebSocket,
    rooms: string[],
    userId: string
}

const users: User[] = []

function checkUser(token : string): string | null {
    const decoded = jwt.verify(token, JWT_SECRET);
    if(!decoded || typeof decoded === 'string' || !decoded.userId) {
        return null;
    }
    return decoded['userId'];
}

wss.on("connection", (ws: WebSocket , request) => {
    console.log("Client connected");
    const url = request.url;
    if(!url) return;
    const queryParams = new URLSearchParams(url.split('?')[1]);
    const token = queryParams.get("token") || "";
    const userId = checkUser(token);

    if(!userId) {
        ws.close();
        return;
    }

    users.push({
        ws,
        rooms: [],
        userId: userId
    })

    ws.on("message", (data) => {
        const parsedData = JSON.parse(data.toString());
        switch (parsedData.type) {
            case "joinRoom":
                console.log("Joining room");
                const currentUser = users.find((x)=>x.ws===ws);
                if (!currentUser) {
                    console.error("User not found for WebSocket connection");
                    return;
                }

                if (!currentUser.rooms.includes(parsedData.roomId)) {
                    currentUser.rooms.push(parsedData.roomId);
                }   
                break;

            case "leaveRoom":
                const user = users.find((x)=>x.ws===ws);
                if (!user) {
                    console.error("User not found for WebSocket connection");
                    return;
                }
                user.rooms = user.rooms.filter((x)=> x===parsedData.rooms);
                break;

            case 'chat':
                const chatRoomId = parsedData.roomId;
                const message = parsedData.message;

                users.forEach(( user) => {
                    if (user.rooms.includes(chatRoomId)) {
                        user.ws.send(JSON.stringify({
                            type: "chat",
                            message: message,
                            roomId: chatRoomId
                        }))
                    }
                })
                break;

            case "scene-update":
                const { roomId, elements } = parsedData;
                users.forEach((user) => {
                    if (user.rooms.includes(roomId)) {
                        user.ws.send(JSON.stringify({
                            type: "scene-update",
                            roomId,
                            elements,
                        }));
                    }
                });
                break;
        }
    })

    ws.on("error", (error) => {
        console.error("Error occurred on WebSocket connection:", error);
    })
})
