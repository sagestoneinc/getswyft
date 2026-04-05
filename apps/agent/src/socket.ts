import { io, type Socket } from "socket.io-client";

const WS_URL =
  import.meta.env.VITE_WS_URL ||
  import.meta.env.VITE_WS_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080";

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;
  if (socket) socket.disconnect();
  socket = io(WS_URL, { auth: { token } });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
