import axios from 'axios';
import crypto from 'crypto';
import { env } from '../config/env';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

export interface SendMessageParams {
    to: string;
    message: string;
    messageType?: 'text';
    numberType?: 'bot' | 'human';
}

export interface SendMediaParams {
    to: string;
    mediaUrl: string;
    mediaType: 'image' | 'document' | 'audio' | 'video';
    caption?: string;
    numberType?: 'bot' | 'human';
}

export interface WhatsAppMessage {
    from: string;
    id: string;
    timestamp: string;
    type: 'text' | 'image' | 'document' | 'audio' | 'video';
    text?: {
        body: string;
    };
    image?: {
        id: string;
        mime_type: string;
        sha256: string;
    };
    document?: {
        id: string;
        filename: string;
        mime_type: string;
        sha256: string;
    };
}

export class WhatsAppService {
    private apiUrl: string;
    private botPhoneNumberId: string;
    private humanPhoneNumberId: string;
    private accessToken: string;
    private appSecret: string;

    constructor() {
        this.apiUrl = WHATSAPP_API_URL;
        this.botPhoneNumberId = env.whatsappPhoneNumberId;
        this.humanPhoneNumberId = env.whatsappHumanPhoneNumberId;
        this.accessToken = env.whatsappApiToken;
        this.appSecret = env.facebookAppSecret;
    }

    private getPhoneNumberId(numberType: 'bot' | 'human' = 'bot'): string {
        return numberType === 'human' ? this.humanPhoneNumberId : this.botPhoneNumberId;
    }

    private generateAppSecretProof(): string {
        if (!this.appSecret || !this.accessToken) {
            return '';
        }
        return crypto
            .createHmac('sha256', this.appSecret)
            .update(this.accessToken)
            .digest('hex');
    }

    async sendTextMessage(params: SendMessageParams): Promise<string> {
        try {
            const phoneNumberId = this.getPhoneNumberId(params.numberType || 'bot');
            const appsecretProof = this.generateAppSecretProof();
            const headers: any = {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            };
            
            if (appsecretProof) {
                headers['appsecret_proof'] = appsecretProof;
            }

            const response = await axios.post(
                `${this.apiUrl}/${phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: params.to,
                    type: 'text',
                    text: {
                        preview_url: false,
                        body: params.message,
                    },
                },
                { headers }
            );

            return response.data.messages[0].id;
        } catch (error: any) {
            console.error('WhatsApp send message error:', error.response?.data || error.message);
            throw new Error(`Failed to send WhatsApp message: ${error.message}`);
        }
    }

    async sendMediaMessage(params: SendMediaParams): Promise<string> {
        try {
            const phoneNumberId = this.getPhoneNumberId(params.numberType || 'bot');
            const appsecretProof = this.generateAppSecretProof();
            const headers: any = {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            };
            
            if (appsecretProof) {
                headers['appsecret_proof'] = appsecretProof;
            }

            const mediaObject: any = {
                link: params.mediaUrl,
            };

            if (params.caption && params.mediaType === 'image') {
                mediaObject.caption = params.caption;
            }

            const response = await axios.post(
                `${this.apiUrl}/${phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: params.to,
                    type: params.mediaType,
                    [params.mediaType]: mediaObject,
                },
                { headers }
            );

            return response.data.messages[0].id;
        } catch (error: any) {
            console.error('WhatsApp send media error:', error.response?.data || error.message);
            throw new Error(`Failed to send WhatsApp media: ${error.message}`);
        }
    }

    async markAsRead(messageId: string, numberType: 'bot' | 'human' = 'bot'): Promise<void> {
        try {
            const phoneNumberId = this.getPhoneNumberId(numberType);
            const appsecretProof = this.generateAppSecretProof();
            const headers: any = {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            };
            
            if (appsecretProof) {
                headers['appsecret_proof'] = appsecretProof;
            }

            await axios.post(
                `${this.apiUrl}/${phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    status: 'read',
                    message_id: messageId,
                },
                { headers }
            );
        } catch (error: any) {
            console.error('WhatsApp mark as read error:', error.response?.data || error.message);
        }
    }

    async getMediaUrl(mediaId: string): Promise<string> {
        try {
            const appsecretProof = this.generateAppSecretProof();
            const headers: any = {
                'Authorization': `Bearer ${this.accessToken}`,
            };
            
            if (appsecretProof) {
                headers['appsecret_proof'] = appsecretProof;
            }

            const response = await axios.get(`${this.apiUrl}/${mediaId}`, {
                headers,
            });

            return response.data.url;
        } catch (error: any) {
            console.error('WhatsApp get media URL error:', error.response?.data || error.message);
            throw new Error(`Failed to get media URL: ${error.message}`);
        }
    }

    verifyWebhook(mode: string, token: string, challenge: string): string | null {
        if (mode === 'subscribe' && token === env.whatsappWebhookVerifyToken) {
            console.log('Webhook verified successfully');
            return challenge;
        }
        console.log('Webhook verification failed');
        return null;
    }

    parseWebhookMessage(body: any): WhatsAppMessage | null {
        try {
            const entry = body.entry?.[0];
            const change = entry?.changes?.[0];
            const value = change?.value;
            const message = value?.messages?.[0];

            if (!message) {
                return null;
            }

            return message as WhatsAppMessage;
        } catch (error) {
            console.error('Error parsing webhook message:', error);
            return null;
        }
    }

    parseStatusUpdate(body: any): { messageId: string; status: string } | null {
        try {
            const entry = body.entry?.[0];
            const change = entry?.changes?.[0];
            const value = change?.value;
            const status = value?.statuses?.[0];

            if (!status) {
                return null;
            }

            return {
                messageId: status.id,
                status: status.status,
            };
        } catch (error) {
            console.error('Error parsing status update:', error);
            return null;
        }
    }

    async getContactProfile(phoneNumber: string): Promise<{ name: string | null; profilePictureUrl: string | null }> {
        try {
            const appsecretProof = this.generateAppSecretProof();
            const headers: any = {
                'Authorization': `Bearer ${this.accessToken}`,
            };
            
            if (appsecretProof) {
                headers['appsecret_proof'] = appsecretProof;
            }

            // Get contact profile
            const response = await axios.get(
                `${this.apiUrl}/${this.botPhoneNumberId}/contacts`,
                {
                    headers,
                    params: {
                        wa_id: phoneNumber,
                    },
                }
            );

            const contact = response.data?.contacts?.[0];
            
            return {
                name: contact?.profile?.name || null,
                profilePictureUrl: null, // WhatsApp API doesn't provide profile pictures directly
            };
        } catch (error: any) {
            console.error('WhatsApp get contact profile error:', error.response?.data || error.message);
            // Return null values if profile fetch fails
            return {
                name: null,
                profilePictureUrl: null,
            };
        }
    }

    parseContactInfo(body: any): { name: string | null } | null {
        try {
            const entry = body.entry?.[0];
            const change = entry?.changes?.[0];
            const value = change?.value;
            const contact = value?.contacts?.[0];

            if (!contact) {
                return null;
            }

            return {
                name: contact.profile?.name || null,
            };
        } catch (error) {
            console.error('Error parsing contact info:', error);
            return null;
        }
    }
}

export const whatsappService = new WhatsAppService();
