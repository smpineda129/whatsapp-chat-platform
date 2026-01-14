import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { MessageModel } from '../models/Message';
import { ConversationModel } from '../models/Conversation';
import { whatsappService } from '../services/whatsapp.service';
import { emitNewMessage } from '../sockets/chat.socket';
import Joi from 'joi';

const router = Router();

// Validation schema
const sendMessageSchema = Joi.object({
    conversation_id: Joi.number().required(),
    content: Joi.string().required(),
    message_type: Joi.string().valid('text', 'image', 'document', 'audio', 'video').default('text'),
    media_url: Joi.string().uri().optional(),
});

// Get messages for a conversation
router.get('/:conversationId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const conversationId = parseInt(req.params.conversationId);
        const { limit = '100', offset = '0' } = req.query;

        const messages = await MessageModel.findByConversation(
            conversationId,
            parseInt(limit as string),
            parseInt(offset as string)
        );

        res.json({ messages });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Send message
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { error, value } = sendMessageSchema.validate(req.body);
        if (error) {
            res.status(400).json({ error: error.details[0].message });
            return;
        }

        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        // Get conversation and contact info
        const conversation = await ConversationModel.findById(value.conversation_id);
        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }

        // Get contact phone number
        const contactQuery = await import('../config/database').then(db =>
            db.db.query('SELECT phone_number FROM contacts WHERE id = $1', [conversation.contact_id])
        );
        const contactPhone = contactQuery.rows[0]?.phone_number;

        if (!contactPhone) {
            res.status(404).json({ error: 'Contact not found' });
            return;
        }

        // Send via WhatsApp
        let whatsappMessageId: string;
        try {
            if (value.message_type === 'text') {
                whatsappMessageId = await whatsappService.sendTextMessage({
                    to: contactPhone,
                    message: value.content,
                    numberType: conversation.whatsapp_number_type,
                });
            } else if (value.media_url) {
                whatsappMessageId = await whatsappService.sendMediaMessage({
                    to: contactPhone,
                    mediaUrl: value.media_url,
                    mediaType: value.message_type as any,
                    caption: value.content,
                    numberType: conversation.whatsapp_number_type,
                });
            } else {
                res.status(400).json({ error: 'Media URL required for non-text messages' });
                return;
            }
        } catch (whatsappError: any) {
            console.error('WhatsApp send error:', whatsappError);
            res.status(500).json({ error: 'Failed to send WhatsApp message' });
            return;
        }

        // Save to database
        const message = await MessageModel.create({
            conversation_id: value.conversation_id,
            sender_type: 'agent',
            sender_id: req.user.id,
            content: value.content,
            message_type: value.message_type,
            media_url: value.media_url,
            whatsapp_message_id: whatsappMessageId,
        });

        // Emit new message via WebSocket for real-time updates
        const io = (global as any).io;
        if (io) {
            console.log('Emitting agent message:', message.id);
            emitNewMessage(io, message);
        }

        res.status(201).json({ message });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Mark messages as read
router.post('/:conversationId/read', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const conversationId = parseInt(req.params.conversationId);
        await MessageModel.markAsRead(conversationId);
        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
});

export default router;
