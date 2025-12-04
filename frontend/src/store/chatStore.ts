import { create } from 'zustand';
import api from '../services/api';
import { socketService } from '../services/socket';
import type { ConversationWithDetails, Message, SendMessageData } from '../types';

interface ChatState {
    conversations: ConversationWithDetails[];
    selectedConversation: ConversationWithDetails | null;
    messages: Message[];
    isLoadingConversations: boolean;
    isLoadingMessages: boolean;
    typingUser: { userId: number; userName: string } | null;

    fetchConversations: (filters?: any) => Promise<void>;
    selectConversation: (conversation: ConversationWithDetails | null) => void;
    fetchMessages: (conversationId: number) => Promise<void>;
    sendMessage: (data: SendMessageData) => Promise<void>;
    addMessage: (message: Message) => void;
    updateConversation: (conversation: ConversationWithDetails) => void;
    addConversation: (conversation: ConversationWithDetails) => void;
    setTypingUser: (user: { userId: number; userName: string } | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    conversations: [],
    selectedConversation: null,
    messages: [],
    isLoadingConversations: false,
    isLoadingMessages: false,
    typingUser: null,

    fetchConversations: async (filters?) => {
        set({ isLoadingConversations: true });
        try {
            const params = new URLSearchParams(filters).toString();
            const response = await api.get(`/conversations?${params}`);
            set({ conversations: response.data.conversations, isLoadingConversations: false });
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
            set({ isLoadingConversations: false });
        }
    },

    selectConversation: (conversation) => {
        const current = get().selectedConversation;

        // Leave current conversation room
        if (current) {
            socketService.leaveConversation(current.id);
        }

        // Join new conversation room
        if (conversation) {
            socketService.joinConversation(conversation.id);
            get().fetchMessages(conversation.id);
        }

        set({ selectedConversation: conversation });
    },

    fetchMessages: async (conversationId) => {
        set({ isLoadingMessages: true, messages: [] });
        try {
            const response = await api.get(`/messages/${conversationId}`);
            set({ messages: response.data.messages, isLoadingMessages: false });
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            set({ isLoadingMessages: false });
        }
    },

    sendMessage: async (data) => {
        try {
            const response = await api.post('/messages', data);
            // Message will be added via socket event
        } catch (error) {
            console.error('Failed to send message:', error);
            throw error;
        }
    },

    addMessage: (message) => {
        set((state) => ({
            messages: [...state.messages, message],
        }));

        // Update conversation's last message
        set((state) => ({
            conversations: state.conversations.map((conv) =>
                conv.id === message.conversation_id
                    ? { ...conv, last_message_content: message.content, last_message_at: message.created_at }
                    : conv
            ),
        }));
    },

    updateConversation: (conversation) => {
        set((state) => ({
            conversations: state.conversations.map((conv) =>
                conv.id === conversation.id ? conversation : conv
            ),
        }));

        // Update selected conversation if it's the one being updated
        set((state) => ({
            selectedConversation:
                state.selectedConversation?.id === conversation.id
                    ? conversation
                    : state.selectedConversation,
        }));
    },

    addConversation: (conversation) => {
        set((state) => ({
            conversations: [conversation, ...state.conversations],
        }));
    },

    setTypingUser: (user) => {
        set({ typingUser: user });
    },
}));
