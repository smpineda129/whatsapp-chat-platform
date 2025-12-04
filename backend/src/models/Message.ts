import { db } from '../config/database';

export type MessageType = 'text' | 'image' | 'document' | 'audio' | 'video';
export type SenderType = 'contact' | 'agent' | 'bot';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
    id: number;
    conversation_id: number;
    whatsapp_message_id: string | null;
    sender_type: SenderType;
    sender_id: number | null;
    content: string;
    message_type: MessageType;
    media_url: string | null;
    status: MessageStatus;
    metadata: Record<string, any>;
    created_at: Date;
}

export interface CreateMessageData {
    conversation_id: number;
    sender_type: SenderType;
    sender_id?: number;
    content: string;
    message_type?: MessageType;
    media_url?: string;
    whatsapp_message_id?: string;
    metadata?: Record<string, any>;
}

export class MessageModel {
    static async create(data: CreateMessageData): Promise<Message> {
        const query = `
      INSERT INTO messages (
        conversation_id, sender_type, sender_id, content, 
        message_type, media_url, whatsapp_message_id, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

        const result = await db.query<Message>(query, [
            data.conversation_id,
            data.sender_type,
            data.sender_id || null,
            data.content,
            data.message_type || 'text',
            data.media_url || null,
            data.whatsapp_message_id || null,
            JSON.stringify(data.metadata || {}),
        ]);

        // Update conversation's last_message_at
        await db.query(
            'UPDATE conversations SET last_message_at = NOW() WHERE id = $1',
            [data.conversation_id]
        );

        return result.rows[0];
    }

    static async findByConversation(
        conversationId: number,
        limit = 100,
        offset = 0
    ): Promise<Message[]> {
        const query = `
      SELECT * FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
      LIMIT $2 OFFSET $3
    `;
        const result = await db.query<Message>(query, [conversationId, limit, offset]);
        return result.rows;
    }

    static async findById(id: number): Promise<Message | null> {
        const query = 'SELECT * FROM messages WHERE id = $1';
        const result = await db.query<Message>(query, [id]);
        return result.rows[0] || null;
    }

    static async updateStatus(id: number, status: MessageStatus): Promise<Message | null> {
        const query = `
      UPDATE messages
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;
        const result = await db.query<Message>(query, [status, id]);
        return result.rows[0] || null;
    }

    static async updateStatusByWhatsAppId(
        whatsappMessageId: string,
        status: MessageStatus
    ): Promise<Message | null> {
        const query = `
      UPDATE messages
      SET status = $1
      WHERE whatsapp_message_id = $2
      RETURNING *
    `;
        const result = await db.query<Message>(query, [status, whatsappMessageId]);
        return result.rows[0] || null;
    }

    static async markAsRead(conversationId: number): Promise<void> {
        const query = `
      UPDATE messages
      SET status = 'read'
      WHERE conversation_id = $1 
        AND sender_type = 'contact'
        AND status != 'read'
    `;
        await db.query(query, [conversationId]);
    }

    static async getConversationStats(conversationId: number) {
        const query = `
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN sender_type = 'agent' THEN 1 END) as agent_messages,
        COUNT(CASE WHEN sender_type = 'bot' THEN 1 END) as bot_messages,
        COUNT(CASE WHEN sender_type = 'contact' THEN 1 END) as contact_messages,
        MIN(created_at) as first_message_at,
        MAX(created_at) as last_message_at
      FROM messages
      WHERE conversation_id = $1
    `;
        const result = await db.query(query, [conversationId]);
        return result.rows[0];
    }
}
