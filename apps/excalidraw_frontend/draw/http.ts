import { HTTP_BACKEND } from "@/config";
import axios from "axios";

export async function getExistingShapes(roomId: string) {
    try {
        const res = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`);
        if (!res.data || !res.data.messages) {
            throw new Error("Invalid response structure");
        }
        const messages = res.data.messages;
        const shapes = messages.map((x: { message: string }) => {
            const messageData = JSON.parse(x.message);
            return messageData;
        });
        return shapes;
    } catch (error) {
        console.error("Error fetching existing shapes:", error);
        throw error; // Rethrow the error for further handling if needed
    }
}
