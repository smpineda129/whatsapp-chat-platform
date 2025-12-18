import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    AppBar,
    Toolbar,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    CircularProgress,
    Chip,
    Paper,
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    Message,
    Chat,
    SmartToy,
    Person,
    Speed,
    AccessTime,
    Logout,
    ArrowBack,
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

interface GlobalStatistics {
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
    escalationRate: number;
    botResolutionRate: number;
    peakHours: Array<{ hour: number; messageCount: number }>;
    conversationsByDay: Array<{ date: string; count: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const Statistics: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [statistics, setStatistics] = useState<GlobalStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    useEffect(() => {
        fetchStatistics();
        // Refresh every 30 seconds
        const interval = setInterval(fetchStatistics, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchStatistics = async () => {
        try {
            const response = await api.get('/statistics/overview');
            setStatistics(response.data.statistics);
        } catch (error) {
            console.error('Failed to fetch statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        return `${Math.round(seconds / 3600)}h`;
    };

    const formatHour = (hour: number) => {
        return `${hour.toString().padStart(2, '0')}:00`;
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!statistics) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography>No hay datos disponibles</Typography>
            </Box>
        );
    }

    const chatTypeData = [
        { name: 'Bot', value: statistics.botConversations },
        { name: 'Humano', value: statistics.humanConversations },
    ];

    const conversationStatusData = [
        { name: 'Activas', value: statistics.activeConversations },
        { name: 'Cerradas', value: statistics.closedConversations },
    ];

    return (
        <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={() => navigate('/chat')}
                        sx={{ mr: 2 }}
                    >
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Estadísticas - Brilla WhatsApp
                    </Typography>
                    <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
                        <Avatar sx={{ width: 32, height: 32 }}>{user?.full_name[0]}</Avatar>
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                    >
                        <MenuItem onClick={handleLogout}>
                            <Logout sx={{ mr: 1 }} /> Cerrar sesión
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Box sx={{ p: 3 }}>
                {/* KPI Cards */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom variant="body2">
                                            Total Conversaciones
                                        </Typography>
                                        <Typography variant="h4">
                                            {statistics.totalConversations}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                            <TrendingUp fontSize="small" color="success" />
                                            <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                                                {statistics.conversationsLast24Hours} últimas 24h
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Chat sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom variant="body2">
                                            Total Mensajes
                                        </Typography>
                                        <Typography variant="h4">
                                            {statistics.totalMessages}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                            <TrendingUp fontSize="small" color="success" />
                                            <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                                                {statistics.messagesLast24Hours} últimas 24h
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Message sx={{ fontSize: 48, color: 'secondary.main', opacity: 0.3 }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom variant="body2">
                                            Tiempo de Respuesta
                                        </Typography>
                                        <Typography variant="h4">
                                            {formatTime(statistics.averageResponseTimeSeconds)}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                            Promedio
                                        </Typography>
                                    </Box>
                                    <Speed sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom variant="body2">
                                            Duración Promedio
                                        </Typography>
                                        <Typography variant="h4">
                                            {Math.round(statistics.averageConversationDurationMinutes)}m
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                            Por conversación
                                        </Typography>
                                    </Box>
                                    <AccessTime sx={{ fontSize: 48, color: 'info.main', opacity: 0.3 }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Bot Effectiveness */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Tasa de Resolución del Bot
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
                                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                        <CircularProgress
                                            variant="determinate"
                                            value={statistics.botResolutionRate}
                                            size={120}
                                            thickness={4}
                                            sx={{ color: 'success.main' }}
                                        />
                                        <Box
                                            sx={{
                                                top: 0,
                                                left: 0,
                                                bottom: 0,
                                                right: 0,
                                                position: 'absolute',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Typography variant="h4" component="div" color="text.secondary">
                                                {Math.round(statistics.botResolutionRate)}%
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                                    <Chip
                                        icon={<SmartToy />}
                                        label={`${statistics.botConversations} Bot`}
                                        color="primary"
                                        size="small"
                                    />
                                    <Chip
                                        icon={<Person />}
                                        label={`${statistics.humanConversations} Humano`}
                                        color="secondary"
                                        size="small"
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Distribución por Tipo
                                </Typography>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={chatTypeData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {chatTypeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Estado de Conversaciones
                                </Typography>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={conversationStatusData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {conversationStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index + 2]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Charts */}
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Conversaciones por Día (Últimos 30 días)
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={[...statistics.conversationsByDay].reverse()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(date) => new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                                        />
                                        <YAxis />
                                        <Tooltip
                                            labelFormatter={(date) => new Date(date).toLocaleDateString('es-ES')}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#8884d8"
                                            name="Conversaciones"
                                            strokeWidth={2}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Horas Pico (Últimos 7 días)
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={statistics.peakHours}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="hour"
                                            tickFormatter={formatHour}
                                        />
                                        <YAxis />
                                        <Tooltip
                                            labelFormatter={formatHour}
                                        />
                                        <Legend />
                                        <Bar
                                            dataKey="messageCount"
                                            fill="#82ca9d"
                                            name="Mensajes"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Escalation Rate */}
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Tasa de Escalamiento a Humano
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Box
                                        sx={{
                                            height: 40,
                                            bgcolor: 'grey.200',
                                            borderRadius: 1,
                                            overflow: 'hidden',
                                            position: 'relative',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                height: '100%',
                                                width: `${statistics.escalationRate}%`,
                                                bgcolor: statistics.escalationRate > 30 ? 'error.main' : 'warning.main',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'width 0.3s ease',
                                            }}
                                        >
                                            <Typography variant="body2" color="white" fontWeight="bold">
                                                {Math.round(statistics.escalationRate)}%
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Typography variant="body2" color="textSecondary">
                                    {statistics.humanConversations} de {statistics.totalConversations} conversaciones
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                {statistics.escalationRate < 20
                                    ? '✅ Excelente - El bot está manejando la mayoría de las consultas'
                                    : statistics.escalationRate < 40
                                    ? '⚠️ Moderado - Considera mejorar las respuestas del bot'
                                    : '❌ Alto - Muchas conversaciones requieren atención humana'}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};
