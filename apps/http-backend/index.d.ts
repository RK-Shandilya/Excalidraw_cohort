declare global {
    namespace Express {
        interface Request {
            userId?: any;
        }
    }
}

export {}