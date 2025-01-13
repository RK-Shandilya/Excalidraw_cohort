import { JWT_SECRET } from "@repo/backend-common/config";
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export const authMiddleware:any = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).send({ error: "Access denied. No token provided." });
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        if(decoded) {
            // @ts-ignore
            req.user = decoded.userId;
            next();
        }
    } catch (error) {
        res.status(401).send({ error: "Access denied. Invalid token." });
    }
}