import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:8000';

const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket'], // Force WebSocket for better performance through Gateway
});

socket.on('connect_error', (error) => {
    console.error('Socket.io Connection Error:', error);
});

export default socket;
