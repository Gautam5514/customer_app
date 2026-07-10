import Constants from "expo-constants";

// Resolve the backend base URL.
// 1. EXPO_PUBLIC_API_URL env wins (set this to your machine's LAN IP for devices).
// 2. Otherwise infer the dev machine's host from the Expo packager and use :8080.
// 3. Fallback to localhost (simulator only).
function inferDevHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    "";
  const host = hostUri.split(":")[0];
  if (host && host !== "localhost") return host;
  return null;
}

const ENV_URL = process.env.EXPO_PUBLIC_API_URL;
const devHost = inferDevHost();

export const API_URL =
  ENV_URL ||
  (devHost ? `http://${devHost}:8080` : "http://localhost:8080");

export const API_BASE = `${API_URL}/api`;

// Turn a relative upload path from the API ("/uploads/..") into an absolute URL.
export function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  // Some images were uploaded through the admin panel on the same machine as
  // the API, so the backend baked a literal "http://localhost:8080/..." URL
  // into the database. That only resolves on that machine — on a phone,
  // "localhost" means the phone itself, so the image is just broken. Swap in
  // the API host this device actually resolved instead.
  if (/^https?:\/\/localhost(:\d+)?\//i.test(pathOrUrl)) {
    return pathOrUrl.replace(/^https?:\/\/localhost(:\d+)?/i, API_URL);
  }
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${API_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}
