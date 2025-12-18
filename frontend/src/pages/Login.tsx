import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Container,
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    InputAdornment,
    IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, WhatsApp } from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login, isLoading, error, clearError } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        try {
            await login({ email, password });
            navigate('/');
        } catch (error) {
            // Error is handled in store
        }
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <WhatsApp sx={{ fontSize: 60, color: '#E31E24', mb: 2 }} />
                    <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                        Asistencia Brilla
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Inicia sesión para gestionar conversaciones
                    </Typography>
                </Box>

                <Card sx={{ width: '100%', boxShadow: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <Alert severity="error" sx={{ mb: 3 }}>
                                    {error}
                                </Alert>
                            )}

                            <TextField
                                fullWidth
                                label="Correo electrónico"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                margin="normal"
                                autoComplete="email"
                                autoFocus
                            />

                            <TextField
                                fullWidth
                                label="Contraseña"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                margin="normal"
                                autoComplete="current-password"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={isLoading}
                                sx={{
                                    mt: 3,
                                    mb: 2,
                                    bgcolor: '#E31E24',
                                    '&:hover': { bgcolor: '#B71C1C' },
                                }}
                            >
                                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                            </Button>

                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Credenciales de prueba:<br />
                                    admin@whatsapp-platform.com / admin123<br />
                                    agent@whatsapp-platform.com / agent123
                                </Typography>
                            </Box>
                        </form>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
};
