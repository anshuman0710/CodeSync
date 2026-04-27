import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://codesync-backend-aw89.onrender.com";
const TOKEN_KEY = "codesync-token";
const USER_KEY = "codesync-user";

export const authApi = axios.create({ baseURL: BACKEND_URL });

authApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function setSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  sessionStorage.setItem("codesync-username", user.name);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem("codesync-username");
}

export async function login(payload) {
  const { data } = await authApi.post("/api/auth/login", payload);
  setSession(data);
  return data.user;
}

export async function signup(payload) {
  const { data } = await authApi.post("/api/auth/signup", payload);
  setSession(data);
  return data.user;
}
