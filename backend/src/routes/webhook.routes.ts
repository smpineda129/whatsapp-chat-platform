import { Router, Request, Response } from 'express';
import { whatsappService } from '../services/whatsapp.service';
import { n8nService } from '../services/n8n.service';
import { ContactModel } from '../models/Contact';
import { ConversationModel } from '../models/Conversation';
import { MessageModel } from '../models/Message';

const router = Router();

// Webhook verification (GET)
router.get('/whatsapp', (req: Request, res: Response): void => {
    console.log('📥 GET Webhook verification request received');
    console.log('Query params:', req.query);
    
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    const verifiedChallenge = whatsappService.verifyWebhook(mode, token, challenge);

    if (verifiedChallenge) {
        console.log('✅ Webhook verified successfully');
        res.status(200).send(verifiedChallenge);
    } else {
        console.log('❌ Webhook verification failed');
        res.status(403).send('Forbidden');
    }
});

// Webhook receiver (POST)
router.post('/whatsapp', async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('📨 POST Webhook received from WhatsApp');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        // Immediately respond to WhatsApp
        res.status(200).send('OK');

        // Process webhook asynchronously
        processWebhook(req.body).catch(err => {
            console.error('❌ Webhook processing error:', err);
        });
    } catch (error) {
        console.error('❌ Webhook error:', error);
    }
});

async function processWebhook(body: any): Promise<void> {
    try {
        console.log('🔄 Processing webhook data...');
        
        // Check for status update
        const statusUpdate = whatsappService.parseStatusUpdate(body);
        if (statusUpdate) {
            console.log('📊 Status update received:', statusUpdate);
            await MessageModel.updateStatusByWhatsAppId(
                statusUpdate.messageId,
                statusUpdate.status as any
            );
            return;
        }

        // Check for incoming message
        const message = whatsappService.parseWebhookMessage(body);
        if (!message) {
            console.log('⚠️ No message found in webhook body');
            return;
        }

        console.log('✅ Received WhatsApp message:', message);

        // Find or create contact
        const contact = await ContactModel.findOrCreate({
            phone_number: message.from,
        });

        // Find or create active conversation
        const conversation = await ConversationModel.findOrCreate(contact.id);

        // Extract message content
        let messageContent = '';
        let messageType: any = 'text';
        let mediaUrl: string | undefined;

        if (message.type === 'text' && message.text) {
            messageContent = message.text.body;
        } else if (message.image) {
            messageType = 'image';
            messageContent = 'Imagen recibida';
            mediaUrl = await whatsappService.getMediaUrl(message.image.id);
        } else if (message.document) {
            messageType = 'document';
            messageContent = message.document.filename || 'Documento recibido';
            mediaUrl = await whatsappService.getMediaUrl(message.document.id);
        }

        // Save incoming message (skip if duplicate)
        try {
            await MessageModel.create({
                conversation_id: conversation.id,
                sender_type: 'contact',
                sender_id: contact.id,
                content: messageContent,
                message_type: messageType,
                media_url: mediaUrl,
                whatsapp_message_id: message.id,
            });
        } catch (error: any) {
            // If duplicate message (Meta retry), skip processing
            if (error.code === '23505' && error.constraint === 'messages_whatsapp_message_id_key') {
                console.log('⚠️ Duplicate message detected, skipping:', message.id);
                return;
            }
            throw error;
        }

        // Check if we should escalate to human
        const needsEscalation = await n8nService.checkEscalationKeywords(messageContent);

        if (needsEscalation || conversation.chat_type === 'human') {
            // If already human or needs escalation, don't auto-respond
            if (conversation.chat_type === 'bot') {
                // Transfer to human queue
                await ConversationModel.update(conversation.id, {
                    chat_type: 'human',
                });
            }
            console.log('Message requires human attention');
            return;
        }

        // Get conversation history for context
        const history = await MessageModel.findByConversation(conversation.id, 10);
        const conversationHistory = history.map(msg => ({
            sender: msg.sender_type,
            message: msg.content,
            timestamp: msg.created_at.toISOString(),
        }));

        // Trigger n8n bot
        const botResponse = await n8nService.triggerBot({
            messageId: message.id,
            conversationId: conversation.id,
            contactPhone: contact.phone_number,
            contactName: contact.name || null,
            message: messageContent,
            conversationHistory,
        });

        // Check if bot needs human
        if (botResponse.needsHuman) {
            await ConversationModel.update(conversation.id, {
                chat_type: 'human',
            });
        }

        // Send bot response via WhatsApp
        const whatsappMessageId = await whatsappService.sendTextMessage({
            to: contact.phone_number,
            message: botResponse.response,
        });

        // Save bot response
        await MessageModel.create({
            conversation_id: conversation.id,
            sender_type: 'bot',
            content: botResponse.response,
            whatsapp_message_id: whatsappMessageId,
        });

        // Mark original message as read
        await whatsappService.markAsRead(message.id);

    } catch (error) {
        console.error('Error processing webhook:', error);
        throw error;
    }
}

export default router;
