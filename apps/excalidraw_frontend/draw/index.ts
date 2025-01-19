import axios from "axios";
import { HTTP_BACKEND } from "../config";

type Shape = {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
} | {
    type: "pencil";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export async function initDraw(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket | null) {

    let existingShapes:Shape[] = await getExistingShapes(roomId);

    const ctx = canvas.getContext('2d');
    if(!ctx) {
        return;
    }
    clearCanvas(existingShapes, canvas, ctx);

    let clicked = false;
    let startX = 0;
    let startY = 0;

    canvas.addEventListener("mousedown", (e)=> {
        clicked=true;
        startX = e.clientX;
        startY = e.clientY;
    })

    canvas.addEventListener("mousemove", (e)=> {
        if(clicked) {
            const width = e.clientX - startX;
            const height = e.clientY - startY;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(0, 0, 0)"
            ctx.fillRect(0, 0, canvas.width, canvas. height);
            ctx.strokeStyle = "rgba(255, 255, 255)"
            ctx.strokeRect(startX, startY, width, height);
        }
    })

    canvas.addEventListener("mouseup",(e) => {
        clicked = false
        const width = e.clientX - startX;
        const height = e.clientY - startY;
        let shape: Shape | null = null;
        shape = {
            type: "rect",
            x: startX,
            y: startY,
            height,
            width
        }
        if (!shape) {
            return;
        }
        existingShapes.push(shape);
        socket?.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify({
                shape
            }),
            roomId: roomId
        }))
    })

}

async function getExistingShapes (roomId: string) {
    const res = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`);
    const messages = res.data.messages;
    const shapes = messages.map((x: {message: string}) => {
        const messageData = JSON.parse(x.message);
        return messageData;
    })
    return shapes;
}

function clearCanvas(existingShapes: Shape[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 0, 0)"
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    existingShapes.map((shape) => {
        if (shape.type === "rect") {
            ctx.strokeStyle = "rgba(255, 255, 255)"
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        } else if (shape.type === "circle") {
            console.log(shape);
            ctx.beginPath();
            ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
            ctx.stroke();
            ctx.closePath();                
        }
    })
}