import axios from "axios";
import { API_BASE } from "./config";
import { getCachedToken } from "./token";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

// Attach the Bearer token (read synchronously from the in-memory cache).
api.interceptors.request.use((config) => {
  const token = getCachedToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Listeners notified when the server rejects our token (401) so the app can
// drop the session and route back to the welcome screen.
const unauthorizedListeners = new Set();
export function onUnauthorized(fn) {
  unauthorizedListeners.add(fn);
  return () => unauthorizedListeners.delete(fn);
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      unauthorizedListeners.forEach((fn) => fn());
    }
    return Promise.reject(error);
  }
);

// Normalises an axios error into a human-readable message.
export function apiError(error, fallback = "Something went wrong. Please try again.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    (error?.message === "Network Error"
      ? "Can't reach the server. Check your connection."
      : error?.message) ||
    fallback
  );
}
