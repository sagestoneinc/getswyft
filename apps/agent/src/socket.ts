import { io, type Socket } from "socket.io-client";
import { buildDevSocketAuth } from "./dev-bypass";

const WS_URL = import.meta.env.VITE_WS_BASE_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

let socket: Socket | null = null;

export function connectSocket(options: { token: string | null; tenantSlug: string | null }): Socket {
  const auth =
    options.token
      ? {
          token: options.token,
          tenantSlug: options.tenantSlug || undefined,
        }
      : buildDevSocketAuth(options.tenantSlug);

  if (!auth) {
    throw new Error("Socket authentication required");
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(WS_URL, {
    transports: ["websocket"],
    auth,
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
