import { HTTP_BACKEND } from "@/config";
import axios from "axios";

export const getExistingShapes = async(roomId: string) => {
    const existingShapes = await axios.get(`${HTTP_BACKEND}/drawings/${roomId}`);
    const drawings = existingShapes.data.drawings;

    const shapes = drawings.map((x: {drawing: string}) => {
        const data = JSON.parse(x.drawing);
        return data.shape;
    })

    return shapes;
}