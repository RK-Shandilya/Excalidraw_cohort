import {z} from 'zod';

export const CreateUserSchema = z.object({
    username: z.string().min(3).max(20).trim(),
    name: z.string(),
    password: z.string(),
})

export const SigninSchema = z.object({
    username: z.string().min(3).max(20).trim(),
    password: z.string(),
})

export const CreateRoomSchema = z. object({
    name: z.string().min(3).max(20) ,
    roomId: z.string().min(3).max(20),
})