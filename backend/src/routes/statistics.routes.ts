import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { statisticsService } from '../services/statistics.service';

const router = Router();

// Get global statistics (admin only)
router.get('/overview', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const statistics = await statisticsService.getGlobalStatistics();
        res.json({ statistics });
    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Get agent statistics (admin only)
router.get('/agents', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const agentStats = await statisticsService.getAgentStatistics();
        res.json({ agents: agentStats });
    } catch (error) {
        console.error('Get agent statistics error:', error);
        res.status(500).json({ error: 'Failed to fetch agent statistics' });
    }
});

// Get conversation metrics
router.get('/conversations/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const conversationId = parseInt(req.params.id);
        const metrics = await statisticsService.calculateConversationMetrics(conversationId);
        res.json({ metrics });
    } catch (error: any) {
        console.error('Get conversation metrics error:', error);
        if (error.message === 'Conversation not found') {
            res.status(404).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Failed to fetch conversation metrics' });
    }
});

export default router;
