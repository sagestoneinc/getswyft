import { io, type Socket } from "socket.io-client";

const DEFAULT_WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export function connectRealtime(options: { token: string; tenantId?: string; tenantSlug?: string }) {
  const socket: Socket = io(DEFAULT_WS_BASE_URL, {
    autoConnect: true,
    transports: ["websocket"],
    auth: {
      token: options.token,
      tenantId: options.tenantId,
      tenantSlug: options.tenantSlug,
    },
  });

  return socket;
}
