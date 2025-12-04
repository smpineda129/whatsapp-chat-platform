import { io, Socket } from 'socket.io-client';
import type { Message, ConversationWithDetails } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketService {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    connect(userId: number, role: string): void {
        if (this.socket?.connected) {
            console.log('Socket already connected');
            return;
        }

        this.socket = io(SOCKET_URL, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: this.maxReconnectAttempts,
        });

        this.socket.on('connect', () => {
            console.log('Socket connected');
            this.socket?.emit('authenticate', { userId, role });
            this.reconnectAttempts = 0;
        });

        this.socket.on('authenticated', (data: { success: boolean }) => {
            if (data.success) {
                console.log('Socket authenticated');
            }
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.reconnectAttempts++;
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('Max reconnection attempts reached');
            }
        });
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinConversation(conversationId: number): void {
        this.socket?.emit('join_conversation', conversationId);
    }

    leaveConversation(conversationId: number): void {
        this.socket?.emit('leave_conversation', conversationId);
    }

    sendTyping(conversationId: number, userId: number, userName: string): void {
        this.socket?.emit('typing', { conversationId, userId, userName });
    }

    stopTyping(conversationId: number): void {
        this.socket?.emit('stop_typing', { conversationId });
    }

    onNewMessage(callback: (message: Message) => void): void {
        this.socket?.on('new_message', callback);
    }

    onConversationUpdate(callback: (conversation: ConversationWithDetails) => void): void {
        this.socket?.on('conversation_updated', callback);
    }

    onNewConversation(callback: (conversation: ConversationWithDetails) => void): void {
        this.socket?.on('new_conversation', callback);
    }

    onUserTyping(callback: (data: { userId: number; userName: string }) => void): void {
        this.socket?.on('user_typing', callback);
    }

    onUserStopTyping(callback: () => void): void {
        this.socket?.on('user_stop_typing', callback);
    }

    removeListener(event: string, callback?: any): void {
        if (callback) {
            this.socket?.off(event, callback);
        } else {
            this.socket?.off(event);
        }
    }
}

export const socketService = new SocketService();
