import express, { Request } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
import { authMiddleware } from "./middleware";
import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/types";
import  PrismaClient  from "@repo/db/client";
import bcrypt from "bcryptjs"
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors())

app.post("/signup", async (req, res) => {
    console.log(req.body);
    const parsedData = CreateUserSchema.safeParse(req.body);
    console.log(parsedData);
    if (!parsedData.success) {
        console.log(parsedData.error);
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    try {
        if(parsedData.data.password !== parsedData.data.confirmPassword) {
            res.json({
                message: "Passwords do not match"
            })
            return;
        }
        const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);
        const user = await PrismaClient.user.create({
            data: {
                email: parsedData.data?.email,
                password: hashedPassword,
                name: parsedData.data.name
            }
        })
        res.status(200).json({
            userId: user.id
        })
    } catch(e) {
        res.status(411).json({
            message: "User already exists with this username"
        })
    }
})

app.post("/signin", async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);
    console.log(parsedData);
    if (!parsedData.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }

    // TODO: Compare the hashed pws here
    const user = await PrismaClient.user.findUnique({
        where: {
            email: parsedData.data.email
        }
    })
    console.log(user);

    const comparePassword = await bcrypt.compare(parsedData.data.password, user?.password || "");
    if(!comparePassword) {
        res.json({
            message: "Incorrect password"
        })
        return;
    }

    if (!user) {
        res.status(403).json({
            message: "Not authorized"
        })
        return;
    }
    console.log(user.id, JWT_SECRET)
    const token = jwt.sign({
        userId: user.id
    }, JWT_SECRET);

    res.json({
        token
    })
})

app.post("/room", authMiddleware, async (req: Request, res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    
    const userId = req.userId;

    try {
        const room = await PrismaClient.room.create({
            data: {
                slug: parsedData.data.name,
                adminId: userId
            }
        })

        res.json({
            roomId: room.id
        })
    } catch(e) {
        res.status(411).json({
            message: "Room already exists with this name"
        })
    }
})

app.get("/chats/:roomId", async (req, res) => {
    try {
        const roomId = Number(req.params.roomId);
        console.log(req.params.roomId);
        const messages = await PrismaClient.chat.findMany({
            where: {
                roomId: roomId
            },
            orderBy: {
                id: "desc"
            },
            take: 1000
        });

        res.json({
            messages
        })
    } catch(e) {
        console.log(e);
        res.json({
            messages: []
        })
    }
    
})

app.get("/room/:slug", async (req, res) => {
    const slug = req.params.slug;
    const room = await PrismaClient.room.findFirst({
        where: {
            slug
        }
    });

    res.json({
        room
    })
})

app.listen(3001);