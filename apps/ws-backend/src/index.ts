import {WebSocket} from 'ws'
import jwt from 'jsonwebtoken'
process.loadEnvFile("../../.env");
const wss = new WebSocket.Server({port: 8080})

interface User {
    ws: WebSocket
    rooms: string[],
    userId: string
}

const users:User[] = [];

function checkUser(token: string) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if(!decoded || typeof decoded === 'string' || !decoded.userId) {
        return null;
    }
    return decoded['userId'];
}

wss.on("connection", (ws: WebSocket, request)=> {
    const url = request.url;
    if(!url) return;
    const queryparams = new URLSearchParams(url.split('?')[1]);
    const token = queryparams.get("token") || "";
    const userId = checkUser(token);
    if(!userId) {
        ws.close();
        return;
    }
    console.log("user connected");

    users.push({
        ws,
        rooms: [],
        userId
    })

    ws.on("message", async(data)=> {
        const parsedData = JSON.parse(data.toString());
        switch (parsedData.type){
            case "joinRoom":
                const currentUser = users.find((x)=> x.ws === ws);
                if(!currentUser) {
                    console.error("User not found for WebSocket connection");
                    return;
                }
                if(!currentUser.rooms.includes(parsedData.roomId)){
                    currentUser.rooms.push(parsedData.roomId);
                }
                console.log("room joined");
                break;

            case "leaveRoom":
                const user = users.find((x)=> x.ws === ws);
                if(!user) {
                    console.error("User not found for WebSocket connection");
                    return;
                }
                user.rooms = user.rooms.filter((x)=> x===parsedData.rooms);
                break;

            case "draw":
                const roomId = parsedData.roomId;
                const drawing = parsedData.drawing;

                console.log(drawing);

                users.forEach((user) => {
                    if(user.rooms.includes(roomId)){
                        if(user.ws != ws) {
                            user.ws.send(JSON.stringify({
                                type: "draw",
                                drawing: drawing,
                                roomId: roomId
                            }))
                        }
                    }
                });
                break;
            case "erase":
                const rID = parsedData.roomId;
                const erasedIndices = parsedData.erasedIndices;

                users.forEach((user)=> {
                    if(user.rooms.includes(rID)) {
                        if(user.ws !==ws){
                            user.ws.send(JSON.stringify({
                                type: "erase",
                                erasedIndices,
                                roomId: rID,
                            }))
                        }
                    }
                })
            break;
            case "update":
                const index = parsedData.index;
                const updatedElement = parsedData.updatedElement;
                const id = parsedData.roomId;
                users.forEach((user)=> {
                    if(user.rooms.includes(id)) {
                        if(user.ws !==ws) {
                            user.ws.send(JSON.stringify({
                                type: "update",
                                index,
                                updatedElement,
                                roomId: id,
                            }))
                        }
                    }
                })
            break;
        }
    })
})