import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
        res.status(401).json({ message: "Access denied: No token provided" });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET!) as { userId: string };
        if(decoded) {
            req.userId = decoded.userId;
            next();
        }
    } catch (error) {
        console.error("Authentication error:", error);
        res.status(401).json({ message: "Unauthorized: Invalid token" });
        return;
    }
};
