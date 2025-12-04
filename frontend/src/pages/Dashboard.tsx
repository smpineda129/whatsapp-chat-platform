import React, { useEffect, useState } from 'react';
import {
    Box,
    Container,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
} from '@mui/material';
import {
    Chat as ChatIcon,
    TrendingUp,
    Timer,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../services/api';
import type { GlobalStatistics, AgentStatistics } from '../types';

const COLORS = ['#25d366', '#128c7e', '#075e54', '#34b7f1'];

export const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<GlobalStatistics | null>(null);
    const [agents, setAgents] = useState<AgentStatistics[]>([]);

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchStatistics = async () => {
        try {
            const [statsRes, agentsRes] = await Promise.all([
                api.get('/statistics/overview'),
                api.get('/statistics/agents'),
            ]);
            setStats(statsRes.data.statistics);
            setAgents(agentsRes.data.agents);
        } catch (error) {
            console.error('Failed to fetch statistics:', error);
        }
    };

    if (!stats) {
        return <Typography>Cargando estadísticas...</Typography>;
    }

    const chatTypeData = [
        { name: 'Bot', value: stats.botConversations },
        { name: 'Humano', value: stats.humanConversations },
    ];

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Dashboard de Estadísticas
            </Typography>

            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <ChatIcon sx={{ mr: 1, color: '#25d366' }} />
                                <Typography color="text.secondary" variant="body2">
                                    Conversaciones Totales
                                </Typography>
                            </Box>
                            <Typography variant="h3" fontWeight="bold">
                                {stats.totalConversations}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {stats.activeConversations} activas
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <TrendingUp sx={{ mr: 1, color: '#128c7e' }} />
                                <Typography color="text.secondary" variant="body2">
                                    Mensajes (24h)
                                </Typography>
                            </Box>
                            <Typography variant="h3" fontWeight="bold">
                                {stats.messagesLast24Hours}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {stats.totalMessages} total
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Timer sx={{ mr: 1, color: '#075e54' }} />
                                <Typography color="text.secondary" variant="body2">
                                    Tiempo de Respuesta
                                </Typography>
                            </Box>
                            <Typography variant="h3" fontWeight="bold">
                                {Math.round(stats.averageResponseTimeSeconds)}s
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Promedio
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <ChatIcon sx={{ mr: 1, color: '#34b7f1' }} />
                                <Typography color="text.secondary" variant="body2">
                                    Duración Promedio
                                </Typography>
                            </Box>
                            <Typography variant="h3" fontWeight="bold">
                                {Math.round(stats.averageConversationDurationMinutes)}m
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Por conversación
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Bot vs Humano
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={chatTypeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {chatTypeData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Rendimiento de Agentes
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            {agents.map((agent) => (
                                <Box key={agent.agentId} sx={{ mb: 2 }}>
                                    <Typography variant="body1" fontWeight="medium">
                                        {agent.agentName}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {agent.activeConversations} activas
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {agent.totalConversations} total
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {Math.round(agent.averageResponseTimeSeconds)}s resp.
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};
