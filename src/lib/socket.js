import { io } from "socket.io-client";
import { API_URL } from "./config";

let socket = null;

// Opens (or reuses) the authenticated Socket.io connection.
// The backend verifies handshake.auth.token against JWT_SECRET.
export function connectSocket(token) {
  if (!token) return null;
  if (socket && socket.connected) return socket;
  if (socket) socket.disconnect();

  socket = io(API_URL, {
    transports: ["websocket"],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1500,
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
