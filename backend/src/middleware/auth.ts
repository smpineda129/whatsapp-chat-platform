import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserModel, UserResponse } from '../models/User';

export interface AuthRequest extends Request {
    user?: UserResponse;
}

export interface JwtPayload {
    userId: number;
    email: string;
    role: string;
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const token = authHeader.substring(7);

        try {
            const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
            const user = await UserModel.findById(decoded.userId);

            if (!user || !user.is_active) {
                res.status(401).json({ error: 'Invalid token or user inactive' });
                return;
            }

            req.user = user;
            next();
        } catch (error) {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }

        next();
    };
};

export const generateToken = (user: UserResponse): string => {
    const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };

    return jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' });
};
