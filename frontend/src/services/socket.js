import io from 'socket.io-client';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const socket = io(BASE_URL, {
  transports: ['websocket'],
  autoConnect: true,
});