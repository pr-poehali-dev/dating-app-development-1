const URLS = {
  auth: "https://functions.poehali.dev/afecc843-8ea5-4c3e-b8ea-4417ed223311",
  profiles: "https://functions.poehali.dev/4f3f0bdc-dd8e-4bc7-a463-a3d36b67fd38",
  likes: "https://functions.poehali.dev/c37e7b16-25a5-4fad-b27b-cd0dd5825909",
  matches: "https://functions.poehali.dev/ae9c2fc5-07a8-415c-9bf6-9318d8101a4d",
  messages: "https://functions.poehali.dev/dc1a6137-a066-4ec4-8081-52ac7b0b1530",
};

function getToken(): string {
  return localStorage.getItem("spark_token") || "";
}

function setToken(token: string) {
  localStorage.setItem("spark_token", token);
}

function clearToken() {
  localStorage.removeItem("spark_token");
}

async function req<T>(
  base: keyof typeof URLS,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${URLS[base]}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка сервера");
  return data as T;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  register: async (email: string, password: string, name: string) => {
    const data = await req<{ token: string; user: User }>("auth", "/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    setToken(data.token);
    return data;
  },

  login: async (email: string, password: string) => {
    const data = await req<{ token: string; user: User }>("auth", "/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data;
  },

  me: () => req<{ user: User }>("auth", "/me"),

  logout: async () => {
    await req("auth", "/logout", { method: "POST" });
    clearToken();
  },

  isLoggedIn: () => !!getToken(),
};

// ─── Profiles ─────────────────────────────────────────────────────────────────
export const profilesApi = {
  getDiscover: (params?: { age_min?: number; age_max?: number; looking_for?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return req<{ profiles: Profile[] }>("profiles", `/profiles${qs ? "?" + qs : ""}`);
  },

  updateMe: (data: Partial<Profile>) =>
    req<{ ok: boolean }>("profiles", "/profiles/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getById: (id: number) => req<{ profile: Profile }>("profiles", `/profiles/${id}`),

  uploadPhoto: (image: string, content_type: string) =>
    req<{ ok: boolean; photo_url: string }>("profiles", "/profiles/photo", {
      method: "POST",
      body: JSON.stringify({ image, content_type }),
    }),
};

// ─── Likes ───────────────────────────────────────────────────────────────────
export const likesApi = {
  send: (to_user_id: number, is_super = false) =>
    req<{ ok: boolean; match: boolean; match_id: number | null }>("likes", "/likes", {
      method: "POST",
      body: JSON.stringify({ to_user_id, is_super }),
    }),

  getLikedMe: () => req<{ liked_me: LikedBy[]; total: number }>("likes", "/likes"),
};

// ─── Matches ─────────────────────────────────────────────────────────────────
export const matchesApi = {
  getAll: () => req<{ matches: Match[] }>("matches", "/matches"),
};

// ─── Messages ────────────────────────────────────────────────────────────────
export const messagesApi = {
  getByMatch: (matchId: number) =>
    req<{ messages: Message[] }>("messages", `/messages/${matchId}`),

  send: (matchId: number, text: string) =>
    req<Message>("messages", `/messages/${matchId}`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
};

// ─── Types ───────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  name: string;
  age?: number;
  city?: string;
  bio?: string;
  photo_url?: string;
  tags?: string[];
  verified?: boolean;
  online?: boolean;
  gender?: string;
  looking_for?: string;
  premium?: boolean;
}

export interface Profile {
  id: number;
  name: string;
  age?: number;
  city?: string;
  bio?: string;
  photo_url?: string;
  tags?: string[];
  verified?: boolean;
  online?: boolean;
}

export interface LikedBy {
  id: number;
  name: string;
  age?: number;
  photo_url?: string;
  verified?: boolean;
  is_super?: boolean;
  blurred?: boolean;
}

export interface Match {
  match_id: number;
  partner_id: number;
  name: string;
  age?: number;
  photo_url?: string;
  online?: boolean;
  last_msg?: string;
  last_msg_time?: string;
  unread_count: number;
}

export interface Message {
  id: number;
  sender_id: number;
  text: string;
  created_at: string;
  out: boolean;
  read?: boolean;
}