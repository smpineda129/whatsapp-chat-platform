import { Router, Response } from 'express';
import { UserModel } from '../models/User';
import { authenticate, AuthRequest, generateToken } from '../middleware/auth';
import Joi from 'joi';

const router = Router();

// Validation schemas
const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().required(),
    role: Joi.string().valid('user', 'admin').default('user'),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

// Register
router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            res.status(400).json({ error: error.details[0].message });
            return;
        }

        // Check if user exists
        const existingUser = await UserModel.findByEmail(value.email);
        if (existingUser) {
            res.status(409).json({ error: 'User already exists' });
            return;
        }

        const user = await UserModel.create(value);
        const token = generateToken(user);

        res.status(201).json({
            user,
            token,
        });
    } catch (error: any) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Login
router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            res.status(400).json({ error: error.details[0].message });
            return;
        }

        const user = await UserModel.findByEmail(value.email);
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const isValidPassword = await UserModel.validatePassword(user, value.password);
        if (!isValidPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        if (!user.is_active) {
            res.status(403).json({ error: 'Account is inactive' });
            return;
        }

        const { password_hash, ...userWithoutPassword } = user;
        const token = generateToken(userWithoutPassword);

        res.json({
            user: userWithoutPassword,
            token,
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        res.json({ user: req.user });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Failed to get user data' });
    }
});

export default router;
