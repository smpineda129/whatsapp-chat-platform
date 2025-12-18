import express, { Application } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { db } from './config/database';
import { setupSocketHandlers } from './sockets/chat.socket';

// Import routes
import authRoutes from './routes/auth.routes';
import conversationRoutes from './routes/conversations.routes';
import messageRoutes from './routes/messages.routes';
import statisticsRoutes from './routes/statistics.routes';
import webhookRoutes from './routes/webhook.routes';

const app: Application = express();
const httpServer = createServer(app);

// Trust proxy for ngrok/reverse proxies
app.set('trust proxy', 1);

// Socket.IO setup
const io = new Server(httpServer, {
    cors: {
        origin: env.corsOrigin,
        credentials: true,
    },
});

// Middleware
app.use(helmet());
app.use(cors({
    origin: env.corsOrigin,
    credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
});
app.use('/api/', limiter);

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/webhook', webhookRoutes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
    });
});

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Make io accessible to routes
app.set('io', io);

// Make io globally accessible for webhook routes
(global as any).io = io;

// Start server
const startServer = async () => {
    try {
        // Test database connection
        await db.query('SELECT NOW()');
        console.log('✅ Database connected successfully');

        httpServer.listen(env.port, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${env.port}`);
            console.log(`📡 Environment: ${env.nodeEnv}`);
            console.log(`🔌 Socket.IO ready for connections`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server...');
    httpServer.close(async () => {
        await db.close();
        console.log('Server closed');
        process.exit(0);
    });
});

startServer();

export { app, io };
