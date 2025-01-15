import express, { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import {JWT_SECRET} from '@repo/backend-common/config'
import { authMiddleware } from './middleware';
import client from "@repo/db/client"
import bcrypt from 'bcryptjs'
import {CreateUserSchema, SigninSchema, CreateRoomSchema} from '@repo/common/types'
const PORT = 3000;
const app = express();
app.use(express.json());

app.post("/signup", async(req: Request, res:Response)=>{
    const parsedData = CreateUserSchema.safeParse(req.body);
    if(!parsedData.success){
        res.status(400).json({message: "Invalid request"});
        return;
    }
    // db call
    try {
        const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);
        const user = await client.user.create({
            data: {
                name:parsedData.data.name,
                username: parsedData.data.username,
                password: hashedPassword
            }
        })

        res.json({
            userId: user.id,
            message: "User created"
        })
    } catch (err) {
        console.error(err);
        res.status(500).json({message: "Failed to create user"});
    }
})

app.post("/signin", async(req: Request, res:Response)=>{
    const parsedData = SigninSchema.safeParse(req.body);
    if(!parsedData.success){
        res.status(400).json({message: "Invalid request"});
        return;
    }
    try {
        const user = await client.user.findUnique({
            where: {email: parsedData.data.username}
        })
        if(!user) {
            res.status(401).json({message: "Invalid username or password"});
            return;
        }
        const isValidPassword = await bcrypt.compare(parsedData.data.password, user.password);
        if(!isValidPassword) {
            res.status(401).json({message: "Invalid password"});
        }
        const token = jwt.sign({userId:user.id}, JWT_SECRET, {expiresIn: "1h"});
        res.json({token});
    } catch(err) {
        console.error(err);
        res.status(500).json({message: "Failed to signin"});
    }
})

app.post("/room", authMiddleware, async(req: Request, res:Response)=>{
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if(!parsedData.success){
        res.status(400).json({message: "Invalid request"});
    }
    // db call
    try {
        // @ts-ignore
        const userId = req.userId
        const room = await client.room.create({
            data: {
                name: parsedData.data?.name,
                adminId: userId
            }
        })

        res.json({
            roomId: 12345,
        })
    } catch (err) {
        console.error(err);
        res.status(500).json({message: "Failed to create room"});
    }
})

app.get("/chats/:roomId", async(req: Request, res: Response)=> {
    const roomId = Number(req.params.roomId);
    const messages = await client.chat.findMany({
        where: {
            roomId: roomId
        },
        orderby: {
            id: "desc"
        },
        take: 50
    })
})

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})