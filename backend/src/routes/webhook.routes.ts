import { Router, Request, Response } from 'express';
import { whatsappService } from '../services/whatsapp.service';
import { n8nService } from '../services/n8n.service';
import { ContactModel } from '../models/Contact';
import { ConversationModel } from '../models/Conversation';
import { MessageModel } from '../models/Message';
import { emitNewMessage } from '../sockets/chat.socket';

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

        // Extract contact info from webhook
        const contactInfo = whatsappService.parseContactInfo(body);
        
        // Find or create contact
        let contact = await ContactModel.findOrCreate({
            phone_number: message.from,
            name: contactInfo?.name || undefined,
        });

        // Update contact name if it changed
        if (contactInfo?.name && contact.name !== contactInfo.name) {
            contact = await ContactModel.update(contact.id, {
                name: contactInfo.name,
            }) || contact;
        }

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
        let incomingMessage;
        try {
            incomingMessage = await MessageModel.create({
                conversation_id: conversation.id,
                sender_type: 'contact',
                sender_id: contact.id,
                content: messageContent,
                message_type: messageType,
                media_url: mediaUrl,
                whatsapp_message_id: message.id,
            });

            // Emit new message via WebSocket for real-time updates
            const io = (global as any).io;
            if (io) {
                emitNewMessage(io, incomingMessage);
            }
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
                console.log('✅ Chat transferred to human attention');
            } else {
                console.log('💬 Message saved for human agent (chat already in human mode)');
            }
            // Message is saved, but no auto-response. Human agent will respond manually.
            return;
        }

        // Get conversation history for context
        const history = await MessageModel.findByConversation(conversation.id, 10);
        
        // Check if this is the first user message (only the current message exists)
        const isFirstMessage = history.length === 1 && history[0].sender_type === 'contact';
        
        // If first message, send welcome menu instead of processing with GPT
        if (isFirstMessage) {
            const welcomeMessage = `¡Hola! 👋 Bienvenido al asistente virtual de *Brilla*.

¿En qué puedo ayudarte hoy? Selecciona una opción:

1️⃣ *Consultar cupo disponible*
2️⃣ *Conocer productos y plazos*
3️⃣ *Requisitos para solicitar crédito*
4️⃣ *Estado de mi solicitud*
5️⃣ *Hablar con un asesor*

Por favor, responde con el número de la opción o describe tu consulta.`;

            // Send welcome message
            const whatsappMessageId = await whatsappService.sendTextMessage({
                to: contact.phone_number,
                message: welcomeMessage,
                numberType: conversation.whatsapp_number_type,
            });

            // Save welcome message
            const welcomeMsg = await MessageModel.create({
                conversation_id: conversation.id,
                sender_type: 'bot',
                content: welcomeMessage,
                whatsapp_message_id: whatsappMessageId,
            });

            // Emit bot message via WebSocket
            const io = (global as any).io;
            if (io) {
                emitNewMessage(io, welcomeMsg);
            }

            await whatsappService.markAsRead(message.id);
            return;
        }

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
            console.log('🔄 Bot requested human transfer');
        }

        // Validate bot response before sending
        if (!botResponse.response || botResponse.response.trim() === '') {
            console.error('⚠️ Bot returned empty response, skipping WhatsApp send');
            console.log('Bot response data:', JSON.stringify(botResponse, null, 2));
            return;
        }

        // Send bot response via WhatsApp
        const whatsappMessageId = await whatsappService.sendTextMessage({
            to: contact.phone_number,
            message: botResponse.response,
            numberType: conversation.whatsapp_number_type,
        });

        // Save bot response
        const botMsg = await MessageModel.create({
            conversation_id: conversation.id,
            sender_type: 'bot',
            content: botResponse.response,
            whatsapp_message_id: whatsappMessageId,
        });

        // Emit bot message via WebSocket
        const io = (global as any).io;
        if (io) {
            emitNewMessage(io, botMsg);
        }

        // Mark original message as read
        await whatsappService.markAsRead(message.id);

    } catch (error) {
        console.error('Error processing webhook:', error);
        throw error;
    }
}

export default router;
