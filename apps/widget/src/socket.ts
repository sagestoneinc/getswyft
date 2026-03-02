import { io, type Socket } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL;

let socket: Socket | null = null;

export function connectSocket(visitorJwt: string): Socket {
  if (socket?.connected) return socket;

  socket = io(WS_URL, {
    auth: { token: visitorJwt },
  });

  return socket;
}

export function joinConversation(conversationId: string): void {
  if (!socket) throw new Error("Socket not connected");
  socket.emit("join", conversationId);
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
