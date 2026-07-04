import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, onUnauthorized } from "../lib/api";
import { loadToken, saveToken, clearToken } from "../lib/token";
import { connectSocket, disconnectSocket } from "../lib/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [booting, setBooting] = useState(true);
  const wsTokenRef = useRef(null);

  // Hydrate session from secure storage on boot.
  useEffect(() => {
    (async () => {
      const saved = await loadToken();
      if (saved) {
        try {
          const { data } = await api.get("/auth/me");
          // This is the CUSTOMER app — evict any non-customer session left over
          // from before the login portal gate (e.g. a provider account). It
          // would otherwise fail every customer action with "access only".
          if (data.user?.role !== "customer") {
            await clearToken();
          } else {
            setUser(data.user);
            setToken(saved);
            openSocket(saved);
          }
        } catch {
          await clearToken();
        }
      }
      setBooting(false);
    })();
  }, []);

  // Auto-logout when the server rejects our token.
  useEffect(() => onUnauthorized(() => { void signOut(); }), []);

  function openSocket(t) {
    const ws = wsTokenRef.current || t;
    connectSocket(ws);
  }

  async function persistSession({ token: t, wsToken, user: u }) {
    wsTokenRef.current = wsToken || t;
    await saveToken(t);
    setToken(t);
    setUser(u);
    openSocket(t);
  }

  async function signIn(email, password) {
    // portal:"customer" — the server rejects professional accounts here with a
    // clear message, instead of letting them in and failing on every action.
    const { data } = await api.post("/auth/login", { email, password, portal: "customer" });
    await persistSession(data);
    return data.user;
  }

  // OTP-based registration is a 3-call flow; the screen drives the steps and
  // calls this with the final payload + emailVerificationToken.
  async function completeRegister(payload) {
    const { data } = await api.post("/auth/register", payload);
    await persistSession(data);
    return data.user;
  }

  async function signOut() {
    try { await api.post("/auth/logout"); } catch {}
    disconnectSocket();
    await clearToken();
    wsTokenRef.current = null;
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch {}
  }

  const value = useMemo(
    () => ({ user, token, booting, signIn, completeRegister, signOut, refreshUser, setUser }),
    [user, token, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
