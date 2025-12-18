import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    Typography,
    List,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    TextField,
    IconButton,
    InputAdornment,
    Chip,
    Avatar,
    Menu,
    MenuItem,
    Divider,
    Paper,
} from '@mui/material';
import {
    Chat as ChatIcon,
    Dashboard as DashboardIcon,
    Search,
    Send,
    SmartToy,
    Person,
    Logout,
    Menu as MenuIcon,
    BarChart as BarChartIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { Switch, FormControlLabel } from '@mui/material';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { socketService } from '../services/socket';
import api from '../services/api';
import { format } from 'date-fns';

const DRAWER_WIDTH = 350;

// Generate consistent color for avatar based on string
const stringToColor = (string: string) => {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 65%, 50%)`;
};

// Get initials from name or phone
const getInitials = (name: string | null, phone: string) => {
    if (name) {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }
    return phone.slice(-2);
};

export const Chat: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const {
        conversations,
        selectedConversation,
        messages,
        isLoadingMessages,
        fetchConversations,
        selectConversation,
        sendMessage,
        addMessage,
        updateConversation,
        setTypingUser,
        typingUser,
    } = useChatStore();

    const [messageInput, setMessageInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isSwitchingMode, setIsSwitchingMode] = useState(false);
    const [isClosingChat, setIsClosingChat] = useState(false);

    useEffect(() => {
        fetchConversations();

        // Socket event listeners
        socketService.onNewMessage((message) => {
            addMessage(message);
        });

        socketService.onConversationUpdate((conversation) => {
            updateConversation(conversation);
        });

        socketService.onUserTyping((data) => {
            setTypingUser(data);
        });

        socketService.onUserStopTyping(() => {
            setTypingUser(null);
        });

        return () => {
            socketService.removeListener('new_message');
            socketService.removeListener('conversation_updated');
            socketService.removeListener('user_typing');
            socketService.removeListener('user_stop_typing');
        };
    }, []);

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedConversation) return;

        try {
            await sendMessage({
                conversation_id: selectedConversation.id,
                content: messageInput.trim(),
            });
            setMessageInput('');
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleToggleBotMode = async () => {
        if (!selectedConversation) return;
        
        setIsSwitchingMode(true);
        try {
            const newMode = selectedConversation.chat_type === 'bot' ? 'human' : 'bot';
            const endpoint = newMode === 'bot' 
                ? `/conversations/${selectedConversation.id}/transfer-to-bot`
                : `/conversations/${selectedConversation.id}/transfer`;
            
            const payload = newMode === 'human' ? { user_id: user?.id } : {};
            
            await api.post(endpoint, payload);
            
            // Update local state
            const updatedConversation = {
                ...selectedConversation,
                chat_type: newMode,
                assigned_to_user_id: newMode === 'human' ? user?.id : null,
            };
            
            updateConversation(updatedConversation as any);
            selectConversation(updatedConversation as any);
        } catch (error) {
            console.error('Failed to toggle bot mode:', error);
            alert('Error al cambiar el modo. Intenta de nuevo.');
        } finally {
            setIsSwitchingMode(false);
        }
    };

    const handleCloseConversation = async () => {
        if (!selectedConversation) return;
        
        const confirmed = window.confirm('¿Estás seguro de que deseas finalizar este chat? El usuario podrá iniciar una nueva conversación si vuelve a escribir.');
        if (!confirmed) return;
        
        setIsClosingChat(true);
        try {
            await api.post(`/conversations/${selectedConversation.id}/close`);
            
            // Update local state
            const updatedConversation = {
                ...selectedConversation,
                status: 'closed' as const,
                ended_at: new Date().toISOString(),
            };
            
            updateConversation(updatedConversation as any);
            selectConversation(null);
            
            // Refresh conversations list
            await fetchConversations();
        } catch (error) {
            console.error('Failed to close conversation:', error);
            alert('Error al finalizar el chat. Intenta de nuevo.');
        } finally {
            setIsClosingChat(false);
        }
    };

    const filteredConversations = conversations.filter((conv) =>
        conv.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.contact_phone.includes(searchQuery)
    );

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Toolbar>
                <Typography variant="h6" noWrap component="div">
                    Conversaciones
                </Typography>
            </Toolbar>
            <Divider />

            <Box sx={{ p: 2 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            <List sx={{ flex: 1, overflow: 'auto' }}>
                {filteredConversations.map((conv) => {
                    const identifier = conv.contact_name || conv.contact_phone;
                    const avatarColor = stringToColor(identifier);
                    const initials = getInitials(conv.contact_name, conv.contact_phone);
                    
                    return (
                        <ListItemButton
                            key={conv.id}
                            selected={selectedConversation?.id === conv.id}
                            onClick={() => selectConversation(conv)}
                        >
                            <ListItemIcon>
                                <Avatar sx={{ bgcolor: avatarColor }}>
                                    {initials}
                                </Avatar>
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {conv.contact_name || conv.contact_phone}
                                        <Chip
                                            size="small"
                                            icon={conv.chat_type === 'bot' ? <SmartToy fontSize="small" /> : <Person fontSize="small" />}
                                            label={conv.chat_type === 'bot' ? 'Bot' : 'Humano'}
                                            color={conv.chat_type === 'bot' ? 'primary' : 'secondary'}
                                        />
                                    </Box>
                                }
                                secondary={conv.last_message_content}
                                secondaryTypographyProps={{
                                    noWrap: true,
                                }}
                            />
                        </ListItemButton>
                    );
                })}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <ChatIcon sx={{ mr: 2 }} />
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        WhatsApp Platform
                    </Typography>

                    <IconButton color="inherit" onClick={() => navigate('/statistics')} title="Estadísticas">
                        <BarChartIcon />
                    </IconButton>

                    {user?.role === 'admin' && (
                        <IconButton color="inherit" onClick={() => navigate('/dashboard')} title="Dashboard">
                            <DashboardIcon />
                        </IconButton>
                    )}

                    <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
                        <Avatar sx={{ width: 32, height: 32 }}>{user?.full_name[0]}</Avatar>
                    </IconButton>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                    >
                        <MenuItem disabled>
                            <Typography variant="body2">{user?.email}</Typography>
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <Logout fontSize="small" />
                            </ListItemIcon>
                            Cerrar sesión
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
                }}
            >
                {drawer}
            </Drawer>

            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                    },
                }}
            >
                {drawer}
            </Drawer>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    height: '100vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Toolbar />

                {selectedConversation ? (
                    <>
                        {/* Bot Mode Toggle */}
                        <Paper
                            elevation={1}
                            sx={{
                                p: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom: '1px solid #e0e0e0',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    {selectedConversation.contact_name || selectedConversation.contact_phone}
                                </Typography>
                                <Chip
                                    size="small"
                                    icon={selectedConversation.chat_type === 'bot' ? <SmartToy fontSize="small" /> : <Person fontSize="small" />}
                                    label={selectedConversation.chat_type === 'bot' ? 'Bot Activo' : 'Atención Humana'}
                                    color={selectedConversation.chat_type === 'bot' ? 'primary' : 'secondary'}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={selectedConversation.chat_type === 'bot'}
                                            onChange={handleToggleBotMode}
                                            disabled={isSwitchingMode}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Typography variant="body2" color="textSecondary">
                                            {selectedConversation.chat_type === 'bot' ? 'Desactivar Bot' : 'Activar Bot'}
                                        </Typography>
                                    }
                                    labelPlacement="start"
                                />
                                <IconButton
                                    color="error"
                                    onClick={handleCloseConversation}
                                    disabled={isClosingChat}
                                    title="Finalizar Chat"
                                    size="small"
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                        </Paper>

                        <Box
                            sx={{
                                flex: 1,
                                overflow: 'auto',
                                p: 2,
                                bgcolor: '#e5ddd5',
                                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cg fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d9d9d9\' fill-opacity=\'0.4\'%3E%3Cpath opacity=\'.5\' d=\'M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z\'/%3E%3Cpath d=\'M6 5V0H5v5H0v1h5v94h1V6h94V5H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                            }}
                        >
                            {messages.map((msg) => (
                                <Box
                                    key={msg.id}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: msg.sender_type === 'contact' ? 'flex-start' : 'flex-end',
                                        mb: 1,
                                    }}
                                >
                                    <Paper
                                        className="message-bubble"
                                        sx={{
                                            p: 1.5,
                                            bgcolor: msg.sender_type === 'contact' ? 'white' : '#dcf8c6',
                                            borderRadius: 2,
                                        }}
                                    >
                                        <Typography variant="body1">{msg.content}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {format(new Date(msg.created_at), 'HH:mm')}
                                        </Typography>
                                    </Paper>
                                </Box>
                            ))}

                            {typingUser && (
                                <Box sx={{ display: 'flex', mb: 1 }}>
                                    <Paper sx={{ p: 1.5, bgcolor: 'white', borderRadius: 2 }}>
                                        <Typography variant="caption" color="text.secondary" className="typing-indicator">
                                            <span>●</span> <span>●</span> <span>●</span>
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}
                        </Box>

                        <Paper sx={{ p: 2 }} elevation={3}>
                            <TextField
                                fullWidth
                                placeholder="Escribe un mensaje..."
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                color="primary"
                                                onClick={handleSendMessage}
                                                disabled={!messageInput.trim()}
                                            >
                                                <Send />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Paper>
                    </>
                ) : (
                    <Box
                        sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: '#f5f5f5',
                        }}
                    >
                        <Typography variant="h6" color="text.secondary">
                            Selecciona una conversación para comenzar
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};
