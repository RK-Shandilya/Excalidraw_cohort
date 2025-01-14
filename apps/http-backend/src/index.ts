import express, { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import {JWT_SECRET} from '@repo/backend-common/config'
import { authMiddleware } from './middleware';
import client from "@repo/db/client"
import {CreateUserSchema, SigninSchema, CreateRoomSchema} from '@repo/common/types'
const PORT = 3000;
const app = express();


app.post("/signup", (req: Request, res:Response)=>{
    const data = CreateUserSchema.safeParse(req.body);
    if(!data.success){
        res.status(400).json({message: "Invalid request"});
        return;
    }
    // db call
    res.json({
        userId: "123",
        message: "User created"
    })
})

app.post("/signin", (req: Request, res:Response)=>{
    const data = SigninSchema.safeParse(req.body);
    if(!data.success){
        res.status(400).json({message: "Invalid request"});
        return;
    }
    const userId = 1
    const token = jwt.sign({userId}, JWT_SECRET, {expiresIn: "1h"});
    res.json({token});
})

app.post("/room", authMiddleware, (req: Request, res:Response)=>{
    const data = CreateRoomSchema.safeParse(req.body);
    if(!data.success){
        res.status(400).json({message: "Invalid request"});
    }
    // db call
    res.json({
        roomId: 12345,
    })
})

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})