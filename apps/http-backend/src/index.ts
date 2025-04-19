import express, { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "@repo/db/client";
import {authMiddleware} from './middleware'
import cors from "cors";
import { signUpSchema, signInSchema, createRoomSchema } from "@repo/common/types";
const app = express();
process.loadEnvFile("../../.env");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.post('/signup', async(req: Request, res: Response) => {
    const parsedData = signUpSchema.safeParse(req.body);
    if(!parsedData.success) {
        res.status(400).json({
            success: false,
            message: "Incorrect Inputs"
        })
        return;
    }
    try {
        if(parsedData.data.password !== parsedData.data.confirmPassword) {
            res.status(401).json({
                success: false,
                message: "Password do not match"
            })
            return;
        }
        const user = await db.user.findFirst({
            where: {
                email: parsedData.data.email
            }
        })
        if(user) {
            res.status(400).json({
                success: false,
                message: "User Already Exists"
            })
            return;
        }
        const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);
        const newUser = await db.user.create({
            data: {
                email: parsedData.data?.email,
                password: hashedPassword,
                name: parsedData.data.username
            }
        })
        res.status(201).json({
            userId: newUser.id
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
})

app.post('/signin', async(req: Request, res:Response, next: NextFunction) => {
    const parsedData = signInSchema.safeParse(req.body);
    if(!parsedData.success) {
        res.status(400).json({
            success: false,
            message: "Incorrect Inputs"
        })
        return;
    }
    try{
        const existingUser = await db.user.findUnique({
            where : {
                email: parsedData.data.email
            }
        })

        if (!existingUser) {
            res.status(403).json({
                message: "User doesn't exist, Please Sign up to continue"
            })
            return;
        }

        const matchedPassword = await bcrypt.compare(parsedData.data.password, existingUser.password);
        if(!matchedPassword) {
            res.status(401).json({
                success: false,
                message: "Incorrect password"
            })
            return;
        }

        const token = jwt.sign({userId: existingUser.id}, process.env.JWT_SECRET!)
        res.status(200).json({
            token
        })
        return;
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
})

app.post('/room', authMiddleware, async(req: Request, res: Response) =>{
    const parsedData = createRoomSchema.safeParse(req.body);
    if(!parsedData.success) {
        res.status(400).json({
            success: false,
            message: "Incorrect Inputs"
        });
        return;
    }
    const userId = req.userId;
    try {
        const room = await db.room.create({
            data:{
                slug: parsedData.data.name,
                adminId: userId
            }
        })
        
        res.status(201).json({
            success: true,
            message: "Room Successfully created",
            roomId: room.id
        });
        return;
    } catch(error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});

app.get('/drawings/:roomId', async(req: Request,res: Response, next:NextFunction)=>{
    try{
        const roomId = Number(req.params.roomId);
        const drawings = await db.drawing.findMany({
            where: {
                roomId: roomId
            },
            orderBy: {
                id: "desc"
            },
            take: 1000
        })
        res.status(200).json({
            drawings
        })
    } catch(error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
})

app.get('/room/:slug',authMiddleware, async(req: Request, res: Response, next: NextFunction) => {
    try{
        const slug = req.params.slug;
        const room = await db.room.findFirst({
            where: {
                slug: slug
            }
        })
        res.status(200).json({
            room
        })
    } catch(error){
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
})

app.listen(3002, () => {
  console.log("Server is running on port 3002");
});