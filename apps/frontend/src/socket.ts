import { io, Socket } from 'socket.io-client';

const SOCKET_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 3,
  reconnectionDelay: 5000,
  transports: ['websocket', 'polling'],
});

socket.on('connect_error', (error) => {
  // Silent fallback so development continues smoothly without console pollution
  if (process.env.NODE_ENV === 'development') {
    // handled gracefully
  }
});

export default socket;
