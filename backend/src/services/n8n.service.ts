import axios from 'axios';
import { env } from '../config/env';

export interface N8NWebhookPayload {
    messageId: string;
    conversationId: number;
    contactPhone: string;
    contactName: string | null;
    message: string;
    conversationHistory: Array<{
        sender: string;
        message: string;
        timestamp: string;
    }>;
}

export interface N8NResponse {
    response: string;
    needsHuman: boolean;
    confidence?: number;
}

export class N8NService {
    private webhookUrl: string;

    constructor() {
        this.webhookUrl = env.n8nWebhookUrl;
    }

    async triggerBot(payload: N8NWebhookPayload): Promise<N8NResponse> {
        try {
            if (!this.webhookUrl) {
                console.warn('N8N webhook URL not configured, skipping bot trigger');
                return {
                    response: 'Lo siento, el bot no está disponible en este momento.',
                    needsHuman: true,
                };
            }

            const response = await axios.post(this.webhookUrl, payload, {
                timeout: 30000, // 30 seconds timeout
            });

            return response.data as N8NResponse;
        } catch (error: any) {
            console.error('N8N webhook error:', error.response?.data || error.message);

            // If n8n fails, escalate to human
            return {
                response: 'Estoy teniendo dificultades técnicas. Déjame transferirte con un agente humano.',
                needsHuman: true,
            };
        }
    }

    async checkEscalationKeywords(message: string): Promise<boolean> {
        const escalationKeywords = [
            'hablar con humano',
            'hablar con persona',
            'hablar con agente',
            'agente',
            'operador',
            'persona real',
            'atención al cliente',
            'supervisor',
            'ayuda urgente',
        ];

        const lowerMessage = message.toLowerCase();
        return escalationKeywords.some(keyword => lowerMessage.includes(keyword));
    }
}

export const n8nService = new N8NService();
