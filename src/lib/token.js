import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "elitecrew_token";

// In-memory mirror so the axios interceptor stays synchronous after boot.
let cachedToken = null;

export async function loadToken() {
  try {
    cachedToken = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    cachedToken = null;
  }
  return cachedToken;
}

export async function saveToken(token) {
  cachedToken = token || null;
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  cachedToken = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function getCachedToken() {
  return cachedToken;
}
