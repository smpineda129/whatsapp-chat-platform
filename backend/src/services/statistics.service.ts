import { db } from '../config/database';
import { MessageModel } from '../models/Message';

export interface GlobalStatistics {
    totalConversations: number;
    activeConversations: number;
    closedConversations: number;
    totalMessages: number;
    botConversations: number;
    humanConversations: number;
    averageResponseTime: number;
    averageDuration: number;
    messagesLast24h: number;
    conversationsLast24h: number;
    escalationRate: number;
    botResolutionRate: number;
    peakHours: Array<{ hour: number; messageCount: number }>;
    conversationsByDay: Array<{ date: string; count: number }>;
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

export class StatisticsService {
    async getGlobalStatistics(): Promise<GlobalStatistics> {
        const conversationsQuery = `
      SELECT 
        COUNT(*) as total_conversations,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_conversations,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_conversations,
        COUNT(CASE WHEN chat_type = 'bot' THEN 1 END) as bot_conversations,
        COUNT(CASE WHEN chat_type = 'human' THEN 1 END) as human_conversations,
        COUNT(CASE WHEN started_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as conversations_last_24_hours
      FROM conversations
    `;

        const messagesQuery = `
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as messages_last_24_hours
      FROM messages
    `;

        const avgResponseTimeQuery = `
      WITH message_pairs AS (
        SELECT 
          m1.conversation_id,
          m1.created_at as contact_time,
          MIN(m2.created_at) as response_time
        FROM messages m1
        LEFT JOIN messages m2 ON m1.conversation_id = m2.conversation_id
          AND m2.created_at > m1.created_at
          AND m2.sender_type IN ('agent', 'bot')
        WHERE m1.sender_type = 'contact'
        GROUP BY m1.id, m1.conversation_id, m1.created_at
      )
      SELECT AVG(EXTRACT(EPOCH FROM (response_time - contact_time))) as avg_response_time
      FROM message_pairs
      WHERE response_time IS NOT NULL
    `;

        const avgDurationQuery = `
      SELECT AVG(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60) as avg_duration
      FROM conversations
      WHERE ended_at IS NOT NULL
    `;

        const peakHoursQuery = `
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as message_count
      FROM messages
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `;

        const conversationsByDayQuery = `
      SELECT 
        DATE(started_at) as date,
        COUNT(*) as count
      FROM conversations
      WHERE started_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(started_at)
      ORDER BY date DESC
      LIMIT 30
    `;

        const [conversationsResult, messagesResult, responseTimeResult, durationResult, peakHoursResult, conversationsByDayResult] =
            await Promise.all([
                db.query(conversationsQuery),
                db.query(messagesQuery),
                db.query(avgResponseTimeQuery),
                db.query(avgDurationQuery),
                db.query(peakHoursQuery),
                db.query(conversationsByDayQuery),
            ]);

        const totalConvs = parseInt(conversationsResult.rows[0].total_conversations) || 0;
        const botConvs = parseInt(conversationsResult.rows[0].bot_conversations) || 0;
        const humanConvs = parseInt(conversationsResult.rows[0].human_conversations) || 0;

        const escalationRate = totalConvs > 0 ? (humanConvs / totalConvs) * 100 : 0;
        const botResolutionRate = totalConvs > 0 ? (botConvs / totalConvs) * 100 : 0;

        return {
            totalConversations: totalConvs,
            activeConversations: parseInt(conversationsResult.rows[0].active_conversations) || 0,
            closedConversations: parseInt(conversationsResult.rows[0].closed_conversations) || 0,
            botConversations: botConvs,
            humanConversations: humanConvs,
            conversationsLast24h: parseInt(conversationsResult.rows[0].conversations_last_24_hours) || 0,
            totalMessages: parseInt(messagesResult.rows[0].total_messages) || 0,
            messagesLast24h: parseInt(messagesResult.rows[0].messages_last_24_hours) || 0,
            averageResponseTime: parseFloat(responseTimeResult.rows[0]?.avg_response_time) || 0,
            averageDuration: parseFloat(durationResult.rows[0]?.avg_duration) || 0,
            escalationRate: Math.round(escalationRate * 100) / 100,
            botResolutionRate: Math.round(botResolutionRate * 100) / 100,
            peakHours: peakHoursResult.rows.map(row => ({
                hour: parseInt(row.hour),
                messageCount: parseInt(row.message_count),
            })),
            conversationsByDay: conversationsByDayResult.rows.map(row => ({
                date: row.date,
                count: parseInt(row.count),
            })),
        };
    }

    async getAgentStatistics(): Promise<AgentStatistics[]> {
        const query = `
      SELECT 
        u.id as agent_id,
        u.full_name as agent_name,
        COUNT(CASE WHEN c.status = 'active' THEN 1 END) as active_conversations,
        COUNT(c.id) as total_conversations,
        COUNT(m.id) as total_messages,
        AVG(
          CASE 
            WHEN m.sender_type = 'agent' THEN 
              EXTRACT(EPOCH FROM (m.created_at - LAG(m.created_at) OVER (PARTITION BY m.conversation_id ORDER BY m.created_at)))
          END
        ) as avg_response_time
      FROM users u
      LEFT JOIN conversations c ON u.id = c.assigned_to_user_id
      LEFT JOIN messages m ON c.id = m.conversation_id AND m.sender_type = 'agent'
      WHERE u.role = 'user'
      GROUP BY u.id, u.full_name
      ORDER BY total_conversations DESC
    `;

        const result = await db.query(query);

        return result.rows.map(row => ({
            agentId: row.agent_id,
            agentName: row.agent_name,
            activeConversations: parseInt(row.active_conversations) || 0,
            totalConversations: parseInt(row.total_conversations) || 0,
            totalMessages: parseInt(row.total_messages) || 0,
            averageResponseTimeSeconds: parseFloat(row.avg_response_time) || 0,
        }));
    }

    async calculateConversationMetrics(conversationId: number): Promise<ConversationMetrics> {
        const conversation = await db.query(
            'SELECT * FROM conversations WHERE id = $1',
            [conversationId]
        );

        if (!conversation.rows.length) {
            throw new Error('Conversation not found');
        }

        const conv = conversation.rows[0];
        const stats = await MessageModel.getConversationStats(conversationId);

        // Calculate first response time
        const firstResponseQuery = `
      SELECT MIN(created_at) as first_response
      FROM messages
      WHERE conversation_id = $1 AND sender_type IN ('agent', 'bot')
    `;
        const firstResponseResult = await db.query(firstResponseQuery, [conversationId]);
        const firstResponse = firstResponseResult.rows[0]?.first_response;

        let firstResponseTimeSeconds = 0;
        if (firstResponse && conv.started_at) {
            firstResponseTimeSeconds = Math.floor(
                (new Date(firstResponse).getTime() - new Date(conv.started_at).getTime()) / 1000
            );
        }

        // Calculate average response time
        const avgResponseQuery = `
      WITH message_pairs AS (
        SELECT 
          EXTRACT(EPOCH FROM (m2.created_at - m1.created_at)) as response_time
        FROM messages m1
        JOIN messages m2 ON m1.conversation_id = m2.conversation_id
          AND m2.created_at > m1.created_at
          AND m2.sender_type IN ('agent', 'bot')
        WHERE m1.conversation_id = $1 
          AND m1.sender_type = 'contact'
          AND NOT EXISTS (
            SELECT 1 FROM messages m3
            WHERE m3.conversation_id = m1.conversation_id
              AND m3.created_at > m1.created_at
              AND m3.created_at < m2.created_at
          )
      )
      SELECT AVG(response_time) as avg_response_time
      FROM message_pairs
    `;
        const avgResponseResult = await db.query(avgResponseQuery, [conversationId]);

        // Calculate duration
        let durationMinutes = 0;
        if (conv.ended_at && conv.started_at) {
            durationMinutes = Math.floor(
                (new Date(conv.ended_at).getTime() - new Date(conv.started_at).getTime()) / 60000
            );
        }

        return {
            conversationId,
            durationMinutes,
            totalMessages: parseInt(stats.total_messages) || 0,
            firstResponseTimeSeconds,
            averageResponseTimeSeconds: parseFloat(avgResponseResult.rows[0]?.avg_response_time) || 0,
        };
    }

    async saveConversationStatistics(conversationId: number): Promise<void> {
        const metrics = await this.calculateConversationMetrics(conversationId);

        const query = `
      INSERT INTO conversation_statistics (
        conversation_id, total_messages, duration_minutes,
        first_response_time_seconds, average_response_time_seconds
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (conversation_id) 
      DO UPDATE SET
        total_messages = EXCLUDED.total_messages,
        duration_minutes = EXCLUDED.duration_minutes,
        first_response_time_seconds = EXCLUDED.first_response_time_seconds,
        average_response_time_seconds = EXCLUDED.average_response_time_seconds,
        calculated_at = NOW()
    `;

        await db.query(query, [
            conversationId,
            metrics.totalMessages,
            metrics.durationMinutes,
            metrics.firstResponseTimeSeconds,
            metrics.averageResponseTimeSeconds,
        ]);
    }
}

export const statisticsService = new StatisticsService();
