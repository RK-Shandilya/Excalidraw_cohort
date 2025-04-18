import { z } from "zod";

export const signUpSchema = z.object({
  username: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6)
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})
export type SignUpFormValues = z.infer<typeof signUpSchema>;
export type SignInFormValues = z.infer<typeof signInSchema>;

export const createRoomSchema = z. object({
  name: z.string().min(3).max(20) ,
  roomId: z.string().min(3).max(20),
})