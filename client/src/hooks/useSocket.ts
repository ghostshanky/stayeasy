import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

// Define the socket URL based on environment
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export const useSocket = () => {
    const { user } = useAuth();
    const token = localStorage.getItem('accessToken');
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!user || !token) {
            return;
        }

        // Initialize socket connection
        const socket = io(SOCKET_URL, {
            auth: {
                token: token
            },
            transports: ['websocket'], // Force WebSocket transport
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        socketRef.current = socket;

        // Connection events
        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            setIsConnected(true);
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            setIsConnected(false);
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setIsConnected(false);
        });

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [user, token]);

    return {
        socket: socketRef.current,
        isConnected
    };
};
