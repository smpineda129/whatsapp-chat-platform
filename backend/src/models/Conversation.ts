import { db } from '../config/database';

export type ConversationStatus = 'active' | 'closed' | 'archived';
export type ChatType = 'bot' | 'human';

export interface Conversation {
    id: number;
    contact_id: number;
    assigned_to_user_id: number | null;
    status: ConversationStatus;
    chat_type: ChatType;
    started_at: Date;
    ended_at: Date | null;
    first_response_at: Date | null;
    last_message_at: Date | null;
    metadata: Record<string, any>;
}

export interface CreateConversationData {
    contact_id: number;
    chat_type?: ChatType;
    assigned_to_user_id?: number;
}

export interface ConversationWithDetails extends Conversation {
    contact_name: string | null;
    contact_phone: string;
    assigned_user_name: string | null;
    unread_count: number;
    last_message_content: string | null;
}

export class ConversationModel {
    static async create(data: CreateConversationData): Promise<Conversation> {
        const query = `
      INSERT INTO conversations (contact_id, chat_type, assigned_to_user_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

        const result = await db.query<Conversation>(query, [
            data.contact_id,
            data.chat_type || 'bot',
            data.assigned_to_user_id || null,
        ]);

        return result.rows[0];
    }

    static async findById(id: number): Promise<Conversation | null> {
        const query = 'SELECT * FROM conversations WHERE id = $1';
        const result = await db.query<Conversation>(query, [id]);
        return result.rows[0] || null;
    }

    static async findActiveByContact(contactId: number): Promise<Conversation | null> {
        const query = `
      SELECT * FROM conversations
      WHERE contact_id = $1 AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `;
        const result = await db.query<Conversation>(query, [contactId]);
        return result.rows[0] || null;
    }

    static async findOrCreate(contactId: number): Promise<Conversation> {
        const existing = await this.findActiveByContact(contactId);
        
        // Check if conversation exists and is still active (within 30 minutes)
        if (existing) {
            const lastMessageTime = existing.last_message_at || existing.started_at;
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            
            // If last message was more than 30 minutes ago, close it and create new one
            if (new Date(lastMessageTime) < thirtyMinutesAgo) {
                await this.update(existing.id, {
                    status: 'closed',
                    ended_at: new Date(),
                });
                
                // Send automatic closure message via WhatsApp
                try {
                    const { whatsappService } = await import('../services/whatsapp.service');
                    const contactQuery = await db.query('SELECT phone_number FROM contacts WHERE id = $1', [contactId]);
                    const contactPhone = contactQuery.rows[0]?.phone_number;
                    
                    if (contactPhone) {
                        await whatsappService.sendTextMessage({
                            to: contactPhone,
                            message: '⏰ Esta conversación ha sido cerrada automáticamente por inactividad. Si necesitas ayuda, envía un nuevo mensaje para iniciar una nueva conversación.',
                        });
                    }
                } catch (error) {
                    console.error('Error sending auto-close message:', error);
                }
                
                // Create new conversation
                return this.create({ contact_id: contactId, chat_type: 'bot' });
            }
            
            return existing;
        }
        
        return this.create({ contact_id: contactId, chat_type: 'bot' });
    }

    static async closeConversation(id: number): Promise<Conversation | null> {
        return this.update(id, {
            status: 'closed',
            ended_at: new Date(),
        });
    }

    static async update(
        id: number,
        data: Partial<{
            assigned_to_user_id: number | null;
            status: ConversationStatus;
            chat_type: ChatType;
            ended_at: Date;
            first_response_at: Date;
            last_message_at: Date;
            metadata: Record<string, any>;
        }>
    ): Promise<Conversation | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                updates.push(`${key} = $${paramCount++}`);
                values.push(value);
            }
        });

        if (updates.length === 0) {
            return this.findById(id);
        }

        values.push(id);

        const query = `
      UPDATE conversations
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

        const result = await db.query<Conversation>(query, values);
        return result.rows[0] || null;
    }

    static async findAllWithDetails(
        filters?: {
            status?: ConversationStatus;
            chat_type?: ChatType;
            assigned_to_user_id?: number;
        },
        limit = 50,
        offset = 0
    ): Promise<ConversationWithDetails[]> {
        const conditions: string[] = ['1=1'];
        const values: any[] = [];
        let paramCount = 1;

        if (filters?.status) {
            conditions.push(`c.status = $${paramCount++}`);
            values.push(filters.status);
        }
        if (filters?.chat_type) {
            conditions.push(`c.chat_type = $${paramCount++}`);
            values.push(filters.chat_type);
        }
        if (filters?.assigned_to_user_id !== undefined) {
            if (filters.assigned_to_user_id === null) {
                conditions.push('c.assigned_to_user_id IS NULL');
            } else {
                conditions.push(`c.assigned_to_user_id = $${paramCount++}`);
                values.push(filters.assigned_to_user_id);
            }
        }

        values.push(limit, offset);

        const query = `
      SELECT 
        c.*,
        con.name as contact_name,
        con.phone_number as contact_phone,
        u.full_name as assigned_user_name,
        COUNT(CASE WHEN m.status NOT IN ('read') AND m.sender_type = 'contact' THEN 1 END) as unread_count,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_content
      FROM conversations c
      LEFT JOIN contacts con ON c.contact_id = con.id
      LEFT JOIN users u ON c.assigned_to_user_id = u.id
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY c.id, con.id, u.id
      ORDER BY c.last_message_at DESC NULLS LAST, c.started_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

        const result = await db.query<ConversationWithDetails>(query, values);
        return result.rows;
    }

    static async transferToHuman(conversationId: number, userId: number): Promise<Conversation | null> {
        return this.update(conversationId, {
            chat_type: 'human',
            assigned_to_user_id: userId,
        });
    }
}
