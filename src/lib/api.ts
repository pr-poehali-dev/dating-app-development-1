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
  action: string,
  options: RequestInit = {},
  extraParams?: Record<string, string>
): Promise<T> {
  const token = getToken();
  const params = new URLSearchParams({ action, ...(extraParams || {}) });
  const url = `${URLS[base]}?${params.toString()}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (e) {
    console.error("Fetch error:", e, "for", url);
    throw new Error("Нет соединения с сервером. Проверь интернет.");
  }

  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    throw new Error("Некорректный ответ сервера");
  }
  if (!res.ok) throw new Error((data.error as string) || "Ошибка сервера");
  return data as T;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  register: async (email: string, password: string, name: string) => {
    const data = await req<{ token: string; user: User }>("auth", "register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    setToken(data.token);
    return data;
  },

  login: async (email: string, password: string) => {
    const data = await req<{ token: string; user: User }>("auth", "login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data;
  },

  me: () => req<{ user: User }>("auth", "me"),

  logout: async () => {
    await req("auth", "logout", { method: "POST" });
    clearToken();
  },

  isLoggedIn: () => !!getToken(),
};

// ─── Profiles ─────────────────────────────────────────────────────────────────
export const profilesApi = {
  getDiscover: (params?: { age_min?: number; age_max?: number; looking_for?: string }) =>
    req<{ profiles: Profile[] }>("profiles", "discover", {}, params as Record<string, string>),

  updateMe: (data: Partial<Profile>) =>
    req<{ ok: boolean }>("profiles", "update_me", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  uploadPhoto: (image: string, content_type: string) =>
    req<{ ok: boolean; photo_url: string }>("profiles", "upload_photo", {
      method: "POST",
      body: JSON.stringify({ image, content_type }),
    }),
};

// ─── Posts ────────────────────────────────────────────────────────────────────
export const postsApi = {
  getFeed: () => req<{ posts: Post[] }>("profiles", "posts_feed"),

  create: (image: string, content_type: string, caption: string) =>
    req<{ ok: boolean; post: Post }>("profiles", "post_create", {
      method: "POST",
      body: JSON.stringify({ image, content_type, caption }),
    }),

  like: (post_id: number) =>
    req<{ liked: boolean; likes_count: number }>("profiles", "post_like", {
      method: "POST",
      body: JSON.stringify({ post_id }),
    }),

  getComments: (post_id: number) =>
    req<{ comments: PostComment[] }>("profiles", "post_comments", {}, { post_id: String(post_id) }),

  addComment: (post_id: number, text: string) =>
    req<{ comment: PostComment }>("profiles", "post_comment", {
      method: "POST",
      body: JSON.stringify({ post_id, text }),
    }),
};

// ─── Live ─────────────────────────────────────────────────────────────────────
export const liveApi = {
  list: () => req<{ streams: LiveStream[] }>("matches", "live_list"),
  start: (title: string) => req<{ stream: LiveStream }>("matches", "live_start", { method: "POST", body: JSON.stringify({ title }) }),
  end: () => req<{ ok: boolean }>("matches", "live_end", { method: "POST" }),
  join: (stream_id: number) => req<{ ok: boolean }>("matches", "live_join", { method: "POST", body: JSON.stringify({ stream_id }) }),
  leave: (stream_id: number) => req<{ ok: boolean }>("matches", "live_leave", { method: "POST", body: JSON.stringify({ stream_id }) }),
  heart: (stream_id: number) => req<{ hearts_count: number }>("matches", "live_heart", { method: "POST", body: JSON.stringify({ stream_id }) }),
  chat: (stream_id: number, text: string) => req<{ message: LiveMessage }>("matches", "live_chat", { method: "POST", body: JSON.stringify({ stream_id, text }) }),
  poll: (stream_id: number, since_id: number) => req<{ stream: LiveStream; messages: LiveMessage[] }>("matches", "live_poll", {}, { stream_id: String(stream_id), since_id: String(since_id) }),
};

export interface LiveStream {
  id: number;
  user_id: number;
  title: string;
  status?: string;
  viewers_count: number;
  hearts_count: number;
  started_at?: string;
  author_name?: string;
  author_photo?: string;
}

export interface LiveMessage {
  id: number;
  stream_id: number;
  user_id: number;
  text: string;
  created_at: string;
  author_name: string;
  author_photo?: string;
}

// ─── Likes ───────────────────────────────────────────────────────────────────
export const likesApi = {
  send: (to_user_id: number, is_super = false) =>
    req<{ ok: boolean; match: boolean; match_id: number | null }>("likes", "send", {
      method: "POST",
      body: JSON.stringify({ to_user_id, is_super }),
    }),

  getLikedMe: () => req<{ liked_me: LikedBy[]; total: number }>("likes", "liked_me"),
};

// ─── Matches ─────────────────────────────────────────────────────────────────
export const matchesApi = {
  getAll: () => req<{ matches: Match[] }>("matches", "list"),
};

// ─── Messages ────────────────────────────────────────────────────────────────
export const messagesApi = {
  getByMatch: (matchId: number) =>
    req<{ messages: Message[] }>("messages", "list", {}, { match_id: String(matchId) }),

  send: (matchId: number, text: string) =>
    req<Message>("messages", "send", {
      method: "POST",
      body: JSON.stringify({ match_id: matchId, text }),
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

export interface Post {
  id: number;
  user_id: number;
  photo_url: string;
  caption?: string;
  created_at: string;
  author_name: string;
  author_photo?: string;
  likes_count: number;
  liked_by_me: boolean;
  comments_count: number;
}

export interface PostComment {
  id: number;
  post_id: number;
  user_id: number;
  text: string;
  created_at: string;
  author_name: string;
  author_photo?: string;
}