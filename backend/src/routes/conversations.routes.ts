import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ConversationModel } from '../models/Conversation';
import Joi from 'joi';

const router = Router();

// Validation schemas
const updateConversationSchema = Joi.object({
    status: Joi.string().valid('active', 'closed', 'archived').optional(),
    assigned_to_user_id: Joi.number().optional().allow(null),
});

const transferSchema = Joi.object({
    user_id: Joi.number().required(),
});

const switchNumberSchema = Joi.object({
    whatsapp_number_type: Joi.string().valid('bot', 'human').required(),
});

// Get all conversations
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status, chat_type, assigned_to_me, limit = '50', offset = '0' } = req.query;

        const filters: any = {};

        if (status) {
            filters.status = status as string;
        }
        if (chat_type) {
            filters.chat_type = chat_type as string;
        }
        if (assigned_to_me === 'true' && req.user) {
            filters.assigned_to_user_id = req.user.id;
        }

        const conversations = await ConversationModel.findAllWithDetails(
            filters,
            parseInt(limit as string),
            parseInt(offset as string)
        );

        res.json({ conversations });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Get conversation by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const conversationId = parseInt(req.params.id);
        const conversation = await ConversationModel.findById(conversationId);

        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }

        res.json({ conversation });
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({ error: 'Failed to fetch conversation' });
    }
});

// Update conversation
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const conversationId = parseInt(req.params.id);

        const { error, value } = updateConversationSchema.validate(req.body);
        if (error) {
            res.status(400).json({ error: error.details[0].message });
            return;
        }

        const conversation = await ConversationModel.update(conversationId, value);

        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }

        res.json({ conversation });
    } catch (error) {
        console.error('Update conversation error:', error);
        res.status(500).json({ error: 'Failed to update conversation' });
    }
});

// Transfer conversation to human agent
router.post('/:id/transfer', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const conversationId = parseInt(req.params.id);

        const { error, value } = transferSchema.validate(req.body);
        if (error) {
            res.status(400).json({ error: error.details[0].message });
            return;
        }

        const conversation = await ConversationModel.transferToHuman(
            conversationId,
            value.user_id
        );

        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }

        res.json({
            conversation,
            message: 'Conversation transferred to human agent'
        });
    } catch (error) {
        console.error('Transfer conversation error:', error);
        res.status(500).json({ error: 'Failed to transfer conversation' });
    }
});

// Transfer conversation back to bot
router.post('/:id/transfer-to-bot', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const conversationId = parseInt(req.params.id);

        const conversation = await ConversationModel.update(conversationId, {
            chat_type: 'bot',
            assigned_to_user_id: null,
        });

        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }

        res.json({
            conversation,
            message: 'Conversation transferred back to bot'
        });
    } catch (error) {
        console.error('Transfer to bot error:', error);
        res.status(500).json({ error: 'Failed to transfer conversation to bot' });
    }
});

// Close/End conversation manually
router.post('/:id/close', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const conversationId = parseInt(req.params.id);

        const conversation = await ConversationModel.closeConversation(conversationId);

        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }

        res.json({
            conversation,
            message: 'Conversation closed successfully'
        });
    } catch (error) {
        console.error('Close conversation error:', error);
        res.status(500).json({ error: 'Failed to close conversation' });
    }
});

// Switch WhatsApp number type (bot or human)
router.post('/:id/switch-number', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const conversationId = parseInt(req.params.id);

        const { error, value } = switchNumberSchema.validate(req.body);
        if (error) {
            res.status(400).json({ error: error.details[0].message });
            return;
        }

        const conversation = await ConversationModel.update(conversationId, {
            whatsapp_number_type: value.whatsapp_number_type,
        });

        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }

        res.json({
            conversation,
            message: `WhatsApp number switched to ${value.whatsapp_number_type} successfully`
        });
    } catch (error) {
        console.error('Switch number error:', error);
        res.status(500).json({ error: 'Failed to switch WhatsApp number' });
    }
});

export default router;
