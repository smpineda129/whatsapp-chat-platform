import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../services/socket';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requireAdmin = false
}) => {
    const { user, token } = useAuthStore();

    useEffect(() => {
        if (user && token) {
            socketService.connect(user.id, user.role);
        }

        return () => {
            // Cleanup on unmount
        };
    }, [user, token]);

    if (!user || !token) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
