import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
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
    Button,
    Stack,
    Divider,
    alpha,
} from '@mui/material';
import {
    TrendingUp,
    Message,
    Chat,
    SmartToy,
    Person,
    Speed,
    AccessTime,
    Logout,
    ArrowBack,
    Download,
    TableChart,
    Assessment,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
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
    totalMessages: number;
    averageResponseTime: number;
    averageDuration: number;
    conversationsLast24h: number;
    messagesLast24h: number;
    botConversations: number;
    humanConversations: number;
    activeConversations: number;
    closedConversations: number;
    escalationRate: number;
    botResolutionRate: number;
    peakHours: Array<{ hour: number; messageCount: number }>;
    conversationsByDay: Array<{ date: string; count: number }>;
}

const COLORS = {
    primary: '#E31E24',
    secondary: '#FDB913',
    accent: '#B71C1C',
    bot: '#4CAF50',
    human: '#FF9800',
    active: '#2196F3',
    closed: '#9E9E9E',
};

export const Statistics: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [stats, setStats] = useState<GlobalStatistics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStatistics();
        const interval = setInterval(fetchStatistics, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchStatistics = async () => {
        try {
            const response = await api.get('/statistics/overview');
            setStats(response.data);
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

    const exportToExcel = () => {
        if (!stats) return;

        const workbook = XLSX.utils.book_new();

        const summaryData = [
            ['Métrica', 'Valor'],
            ['Total Conversaciones', stats.totalConversations],
            ['Total Mensajes', stats.totalMessages],
            ['Tiempo de Respuesta Promedio (min)', Math.round(stats.averageResponseTime / 60)],
            ['Duración Promedio (min)', Math.round(stats.averageDuration / 60)],
            ['Conversaciones Últimas 24h', stats.conversationsLast24h],
            ['Mensajes Últimas 24h', stats.messagesLast24h],
            ['Conversaciones Bot', stats.botConversations],
            ['Conversaciones Humanas', stats.humanConversations],
            ['Conversaciones Activas', stats.activeConversations],
            ['Conversaciones Cerradas', stats.closedConversations],
            ['Tasa de Escalamiento (%)', stats.escalationRate.toFixed(2)],
            ['Tasa de Resolución Bot (%)', stats.botResolutionRate.toFixed(2)],
        ];

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

        const peakHoursData = [
            ['Hora', 'Cantidad de Mensajes'],
            ...stats.peakHours.map(item => [
                `${item.hour}:00`,
                item.messageCount
            ])
        ];
        const peakHoursSheet = XLSX.utils.aoa_to_sheet(peakHoursData);
        XLSX.utils.book_append_sheet(workbook, peakHoursSheet, 'Horas Pico');

        const conversationsByDayData = [
            ['Fecha', 'Conversaciones'],
            ...stats.conversationsByDay.map(item => [
                item.date,
                item.count
            ])
        ];
        const conversationsByDaySheet = XLSX.utils.aoa_to_sheet(conversationsByDayData);
        XLSX.utils.book_append_sheet(workbook, conversationsByDaySheet, 'Conversaciones por Día');

        XLSX.writeFile(workbook, `estadisticas_whatsapp_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToCSV = () => {
        if (!stats) return;

        const csvContent = [
            ['Métrica', 'Valor'],
            ['Total Conversaciones', stats.totalConversations],
            ['Total Mensajes', stats.totalMessages],
            ['Tiempo de Respuesta Promedio (min)', Math.round(stats.averageResponseTime / 60)],
            ['Duración Promedio (min)', Math.round(stats.averageDuration / 60)],
            ['Conversaciones Últimas 24h', stats.conversationsLast24h],
            ['Mensajes Últimas 24h', stats.messagesLast24h],
            ['Conversaciones Bot', stats.botConversations],
            ['Conversaciones Humanas', stats.humanConversations],
            ['Conversaciones Activas', stats.activeConversations],
            ['Conversaciones Cerradas', stats.closedConversations],
            ['Tasa de Escalamiento (%)', stats.escalationRate.toFixed(2)],
            ['Tasa de Resolución Bot (%)', stats.botResolutionRate.toFixed(2)],
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `estadisticas_whatsapp_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const formatTime = (seconds: number): string => {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        return `${Math.round(seconds / 3600)}h`;
    };

    const StatCard = ({ title, value, subtitle, icon, color, trend }: any) => (
        <Card
            elevation={0}
            sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
                border: `1px solid ${alpha(color, 0.2)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${alpha(color, 0.2)}`,
                },
            }}
        >
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color={color}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {trend && <TrendingUp fontSize="small" sx={{ color: COLORS.primary }} />}
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(color, 0.1),
                        }}
                    >
                        {icon}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress sx={{ color: COLORS.primary }} />
            </Box>
        );
    }

    if (!stats) return null;

    const distributionData = [
        { name: 'Bot', value: stats.botConversations, color: COLORS.bot },
        { name: 'Humano', value: stats.humanConversations, color: COLORS.human },
    ];

    const statusData = [
        { name: 'Activas', value: stats.activeConversations, color: COLORS.active },
        { name: 'Cerradas', value: stats.closedConversations, color: COLORS.closed },
    ];

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <AppBar position="fixed" sx={{ bgcolor: COLORS.primary }}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={() => navigate('/chat')}>
                        <ArrowBack />
                    </IconButton>
                    <Assessment sx={{ ml: 2, mr: 1 }} />
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Estadísticas - Asistencia Brilla
                    </Typography>

                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="contained"
                            startIcon={<Download />}
                            onClick={exportToExcel}
                            sx={{
                                bgcolor: 'white',
                                color: COLORS.primary,
                                '&:hover': { bgcolor: alpha('#fff', 0.9) },
                            }}
                        >
                            Excel
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<TableChart />}
                            onClick={exportToCSV}
                            sx={{
                                borderColor: 'white',
                                color: 'white',
                                '&:hover': { borderColor: 'white', bgcolor: alpha('#fff', 0.1) },
                            }}
                        >
                            CSV
                        </Button>
                    </Stack>

                    <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 2 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: COLORS.secondary }}>
                            {user?.full_name[0]}
                        </Avatar>
                    </IconButton>

                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                        <MenuItem disabled>
                            <Typography variant="body2">{user?.email}</Typography>
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <Logout fontSize="small" sx={{ mr: 1 }} />
                            Cerrar sesión
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ mt: 10, mb: 4 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
                    <StatCard
                        title="Total Conversaciones"
                        value={stats.totalConversations}
                        subtitle={`${stats.conversationsLast24h} últimas 24h`}
                        icon={<Chat sx={{ fontSize: 32, color: COLORS.primary }} />}
                        color={COLORS.primary}
                        trend
                    />
                    <StatCard
                        title="Total Mensajes"
                        value={stats.totalMessages}
                        subtitle={`${stats.messagesLast24h} últimas 24h`}
                        icon={<Message sx={{ fontSize: 32, color: COLORS.secondary }} />}
                        color={COLORS.secondary}
                        trend
                    />
                    <StatCard
                        title="Tiempo de Respuesta"
                        value={formatTime(stats.averageResponseTime)}
                        subtitle="Promedio"
                        icon={<Speed sx={{ fontSize: 32, color: COLORS.accent }} />}
                        color={COLORS.accent}
                    />
                    <StatCard
                        title="Duración Promedio"
                        value={formatTime(stats.averageDuration)}
                        subtitle="Por conversación"
                        icon={<AccessTime sx={{ fontSize: 32, color: COLORS.bot }} />}
                        color={COLORS.bot}
                    />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3, mb: 4 }}>
                    <Card elevation={2}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                                Conversaciones por Día (Últimos 30 días)
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={(stats.conversationsByDay || []).slice().reverse()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => new Date(value).toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 8, border: `1px solid ${COLORS.primary}` }}
                                        labelFormatter={(value) => new Date(value).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke={COLORS.primary}
                                        strokeWidth={3}
                                        dot={{ fill: COLORS.primary, r: 4 }}
                                        activeDot={{ r: 6 }}
                                        name="Conversaciones"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card elevation={2}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                                Efectividad del Bot
                            </Typography>
                            <Divider sx={{ mb: 3 }} />
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Typography variant="h2" fontWeight="bold" color={COLORS.bot}>
                                    {stats.botResolutionRate.toFixed(1)}%
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Tasa de Resolución
                                </Typography>
                            </Box>
                            <Stack spacing={2}>
                                <Box>
                                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="body2">Bot</Typography>
                                        <Typography variant="body2" fontWeight="bold">{stats.botConversations}</Typography>
                                    </Stack>
                                    <Box sx={{ height: 8, bgcolor: '#e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
                                        <Box
                                            sx={{
                                                height: '100%',
                                                width: `${stats.botResolutionRate}%`,
                                                bgcolor: COLORS.bot,
                                                transition: 'width 1s ease',
                                            }}
                                        />
                                    </Box>
                                </Box>
                                <Box>
                                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="body2">Humano</Typography>
                                        <Typography variant="body2" fontWeight="bold">{stats.humanConversations}</Typography>
                                    </Stack>
                                    <Box sx={{ height: 8, bgcolor: '#e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
                                        <Box
                                            sx={{
                                                height: '100%',
                                                width: `${stats.escalationRate}%`,
                                                bgcolor: COLORS.human,
                                                transition: 'width 1s ease',
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
                    <Card elevation={2}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                                Distribución por Tipo
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={distributionData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {distributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card elevation={2}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                                Estado de Conversaciones
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Box>

                <Card elevation={2}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                            Horas Pico (Últimos 7 días)
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.peakHours || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                <XAxis
                                    dataKey="hour"
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => `${value}:00`}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: 8, border: `1px solid ${COLORS.primary}` }}
                                    labelFormatter={(value) => `${value}:00`}
                                />
                                <Bar dataKey="messageCount" fill={COLORS.primary} radius={[8, 8, 0, 0]} name="Mensajes" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};
