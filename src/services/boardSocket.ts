import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getBoardSocket(): Socket {
  if (!socket) {
    socket = io(window.location.origin, {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}
