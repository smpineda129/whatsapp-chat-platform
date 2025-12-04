import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import { socketService } from '../services/socket';
import type { User, LoginData, RegisterData } from '../types';

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
    login: (data: LoginData) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isLoading: false,
            error: null,

            login: async (data: LoginData) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/auth/login', data);
                    const { user, token } = response.data;

                    localStorage.setItem('token', token);
                    set({ user, token, isLoading: false });

                    // Connect socket
                    socketService.connect(user.id, user.role);
                } catch (error: any) {
                    const errorMessage = error.response?.data?.error || 'Login failed';
                    set({ error: errorMessage, isLoading: false });
                    throw new Error(errorMessage);
                }
            },

            register: async (data: RegisterData) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/auth/register', data);
                    const { user, token } = response.data;

                    localStorage.setItem('token', token);
                    set({ user, token, isLoading: false });

                    // Connect socket
                    socketService.connect(user.id, user.role);
                } catch (error: any) {
                    const errorMessage = error.response?.data?.error || 'Registration failed';
                    set({ error: errorMessage, isLoading: false });
                    throw new Error(errorMessage);
                }
            },

            logout: () => {
                localStorage.removeItem('token');
                socketService.disconnect();
                set({ user: null, token: null, error: null });
            },

            clearError: () => {
                set({ error: null });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
            }),
        }
    )
);
