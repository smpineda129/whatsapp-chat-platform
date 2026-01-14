// User types
export interface User {
    id: number;
    email: string;
    full_name: string;
    role: 'user' | 'admin';
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    full_name: string;
    role?: 'user' | 'admin';
}

// Contact types
export interface Contact {
    id: number;
    phone_number: string;
    name: string | null;
    profile_picture_url: string | null;
    created_at: string;
    updated_at: string;
}

// Conversation types
export type ConversationStatus = 'active' | 'closed' | 'archived';
export type ChatType = 'bot' | 'human';
export type WhatsAppNumberType = 'bot' | 'human';

export interface Conversation {
    id: number;
    contact_id: number;
    assigned_to_user_id: number | null;
    status: ConversationStatus;
    chat_type: ChatType;
    whatsapp_number_type: WhatsAppNumberType;
    started_at: string;
    ended_at: string | null;
    first_response_at: string | null;
    last_message_at: string | null;
    metadata: Record<string, any>;
}

export interface ConversationWithDetails extends Conversation {
    contact_name: string | null;
    contact_phone: string;
    assigned_user_name: string | null;
    unread_count: number;
    last_message_content: string | null;
}

// Message types
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
    created_at: string;
}

export interface SendMessageData {
    conversation_id: number;
    content: string;
    message_type?: MessageType;
    media_url?: string;
}

// Statistics types
export interface GlobalStatistics {
    totalConversations: number;
    activeConversations: number;
    closedConversations: number;
    totalMessages: number;
    botConversations: number;
    humanConversations: number;
    averageResponseTimeSeconds: number;
    averageConversationDurationMinutes: number;
    messagesLast24Hours: number;
    conversationsLast24Hours: number;
}

export interface AgentStatistics {
    agentId: number;
    agentName: string;
    activeConversations: number;
    totalConversations: number;
    totalMessages: number;
    averageResponseTimeSeconds: number;
}

export interface ConversationMetrics {
    conversationId: number;
    durationMinutes: number;
    totalMessages: number;
    firstResponseTimeSeconds: number;
    averageResponseTimeSeconds: number;
}
