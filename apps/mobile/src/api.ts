import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { User } from "./types";
const base =
  Platform.OS === "web"
    ? "/api"
    : process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080/api";
let nativeToken: string | null = null;
export async function restoreToken() {
  if (Platform.OS !== "web")
    nativeToken = await SecureStore.getItemAsync("bp_session");
}
export async function storeSession(token: string) {
  if (Platform.OS !== "web") {
    nativeToken = token;
    await SecureStore.setItemAsync("bp_session", token);
  }
}
export async function clearSession() {
  nativeToken = null;
  if (Platform.OS !== "web") await SecureStore.deleteItemAsync("bp_session");
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const multipart = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(multipart ? {} : { "Content-Type": "application/json" }),
    ...(nativeToken ? { Authorization: `Bearer ${nativeToken}` } : {}),
  };
  const response = await fetch(`${base}${path}`, {
    ...options,
    credentials: "include",
    headers: { ...headers, ...options.headers },
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(
      "The service could not complete your request. Please try again.",
    );
  }
  if (!response.ok)
    throw new Error(result.error || "Something went wrong. Please try again.");
  return result;
}
export const post = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "POST", body: JSON.stringify(body) });
export const patch = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "PATCH", body: JSON.stringify(body) });
export async function login(email: string, password: string) {
  const result = await post<{ user: User; token: string }>("/auth/login", {
    email,
    password,
  });
  await storeSession(result.token);
  return result.user;
}
export const key = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
export const documentUrl = (id: string) =>
  `${base}/documents/${encodeURIComponent(id)}`;
export async function openDocument(id: string, name: string, mime: string) {
  if (Platform.OS === "web") {
    window.open(documentUrl(id), "_blank", "noopener,noreferrer");
    return;
  }
  const [{ File, Paths }, Sharing] = await Promise.all([
    import("expo-file-system"),
    import("expo-sharing"),
  ]);
  if (!nativeToken)
    throw new Error("Please sign in again to view private evidence.");
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const file = await File.downloadFileAsync(
    documentUrl(id),
    new File(Paths.cache, `${id}-${safeName}`),
    { headers: { Authorization: `Bearer ${nativeToken}` }, idempotent: true },
  );
  try {
    if (!(await Sharing.isAvailableAsync()))
      throw new Error("Document preview is not available on this device.");
    await Sharing.shareAsync(file.uri, { mimeType: mime, dialogTitle: name });
  } finally {
    if (file.exists) file.delete();
  }
}
