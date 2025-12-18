import { Server, Socket } from 'socket.io';

export interface SocketUser {
    userId: number;
    socketId: string;
    role: string;
}

const activeUsers = new Map<number, SocketUser>();

export const setupSocketHandlers = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log('Client connected:', socket.id);

        // Handle user authentication
        socket.on('authenticate', (data: { userId: number; role: string }) => {
            activeUsers.set(data.userId, {
                userId: data.userId,
                socketId: socket.id,
                role: data.role,
            });

            console.log(`User ${data.userId} authenticated`);
            socket.emit('authenticated', { success: true });
        });

        // Join conversation room
        socket.on('join_conversation', (conversationId: number) => {
            socket.join(`conversation:${conversationId}`);
            console.log(`Socket ${socket.id} joined conversation:${conversationId}`);
        });

        // Leave conversation room
        socket.on('leave_conversation', (conversationId: number) => {
            socket.leave(`conversation:${conversationId}`);
            console.log(`Socket ${socket.id} left conversation:${conversationId}`);
        });

        // Typing indicator
        socket.on('typing', (data: { conversationId: number; userId: number; userName: string }) => {
            socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
                userId: data.userId,
                userName: data.userName,
            });
        });

        // Stop typing indicator
        socket.on('stop_typing', (data: { conversationId: number }) => {
            socket.to(`conversation:${data.conversationId}`).emit('user_stop_typing');
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            // Remove user from active users
            for (const [userId, user] of activeUsers.entries()) {
                if (user.socketId === socket.id) {
                    activeUsers.delete(userId);
                    console.log(`User ${userId} disconnected`);
                    break;
                }
            }
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

// Helper function to emit new message to conversation room
export const emitNewMessage = (io: Server, message: any) => {
    console.log('Emitting new message:', message.id, 'to conversation:', message.conversation_id);
    // Emit to conversation room (for users currently viewing the conversation)
    io.to(`conversation:${message.conversation_id}`).emit('new_message', message);
    // Also emit to all connected users (for notification purposes)
    io.emit('new_message', message);
};

// Helper function to emit conversation update
export const emitConversationUpdate = (io: Server, conversation: any) => {
    io.emit('conversation_updated', conversation);
};

// Helper function to notify agents about new conversation
export const notifyNewConversation = (io: Server, conversation: any) => {
    io.emit('new_conversation', conversation);
};
