const URLS = {
  auth: "https://functions.poehali.dev/afecc843-8ea5-4c3e-b8ea-4417ed223311",
  profiles: "https://functions.poehali.dev/4f3f0bdc-dd8e-4bc7-a463-a3d36b67fd38",
  likes: "https://functions.poehali.dev/c37e7b16-25a5-4fad-b27b-cd0dd5825909",
  matches: "https://functions.poehali.dev/ae9c2fc5-07a8-415c-9bf6-9318d8101a4d",
  messages: "https://functions.poehali.dev/dc1a6137-a066-4ec4-8081-52ac7b0b1530",
  admin: "https://functions.poehali.dev/a87188e5-57d7-4ad4-ac31-0a2c3e3d0e18",
  notifications: "https://functions.poehali.dev/5249d7a9-31e2-4ab5-a2da-6b72346e5de4",
  push: "https://functions.poehali.dev/282c24e0-ca25-4712-ad58-26c7742c2653",
  live: "https://functions.poehali.dev/f113fa74-fe31-48da-ae7d-362a933b5294",
  feedback: "https://functions.poehali.dev/2a5b54bc-ebf4-4dd3-b9e1-8cac88e504c3",
  support: "https://functions.poehali.dev/6507255f-25b4-4796-89eb-769f332f415a",
  streaks: "https://functions.poehali.dev/3ce9087c-7bc0-41d7-9ed9-81ef6b7272dd",
  compatibility: "https://functions.poehali.dev/3c47a214-b397-4193-9c25-8db3eb79b2d9",
  config: "https://functions.poehali.dev/6ceb1501-cae9-4306-9855-f9195741490c",
};

function getToken(): string {
  return localStorage.getItem("spark_token") || "";
}
function setToken(token: string) {
  localStorage.setItem("spark_token", token);
}
function clearToken() {
  localStorage.removeItem("spark_token");
  localStorage.removeItem("spark_viewer");
}

// Кэш данных смотрящего для водяного знака на фото
export function cacheViewer(user: { id: number; name?: string }) {
  try {
    localStorage.setItem("spark_viewer", JSON.stringify({ id: user.id, name: user.name || "" }));
  } catch { /* ignore */ }
}
export function getViewerLabel(): string {
  try {
    const raw = localStorage.getItem("spark_viewer");
    if (!raw) return "";
    const v = JSON.parse(raw) as { id: number; name?: string };
    const name = (v.name || "").trim();
    return name ? `${name} · ID ${v.id}` : `ID ${v.id}`;
  } catch {
    return "";
  }
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

  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
      ...(options.headers || {}),
    },
  };

  let res: Response;
  let lastErr: unknown;
  const maxAttempts = 3;
  for (let attempt = 1; ; attempt++) {
    try {
      res = await fetch(url, fetchOptions);
      break;
    } catch (e) {
      lastErr = e;
      if (attempt >= maxAttempts) {
        console.error("Fetch error:", e, "for", url);
        throw new Error("Нет соединения с сервером. Проверь интернет.");
      }
      await new Promise((r) => setTimeout(r, attempt * 600));
    }
  }
  void lastErr;

  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    throw new Error("Некорректный ответ сервера");
  }
  if (!res.ok) throw new Error((data.error as string) || "Ошибка сервера");
  return data as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type SessionInfo = {
  id: number;
  is_current: boolean;
  ip: string;
  user_agent: string;
  created_at: string | null;
  last_active: string | null;
  expires_at: string | null;
};

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  register: async (email: string, password: string, name: string) => {
    const data = await req<{ token: string; user: User }>("auth", "register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    setToken(data.token);
    cacheViewer(data.user);
    return data;
  },

  login: async (email: string, password: string) => {
    const data = await req<{ token: string; user: User }>("auth", "login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    cacheViewer(data.user);
    return data;
  },

  me: async () => {
    const data = await req<{ user: User }>("auth", "me");
    cacheViewer(data.user);
    return data;
  },

  logout: async () => {
    await req("auth", "logout", { method: "POST" });
    clearToken();
  },

  isLoggedIn: () => !!getToken(),

  resetPassword: (email: string) =>
    req<{ ok: boolean }>("auth", "reset_password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  sendReport: (reported_id: number, reason: string, comment: string) =>
    req<{ ok: boolean }>("auth", "send_report", {
      method: "POST",
      body: JSON.stringify({ reported_id, reason, comment }),
    }),
  heartbeat: () => req<{ ok: boolean }>("auth", "heartbeat", { method: "POST" }),

  changePassword: (old_password: string, new_password: string) =>
    req<{ ok: boolean }>("auth", "change_password", {
      method: "POST",
      body: JSON.stringify({ old_password, new_password }),
    }),

  listSessions: () =>
    req<{ sessions: SessionInfo[] }>("auth", "list_sessions"),

  endSession: (session_id: number) =>
    req<{ ok: boolean }>("auth", "end_session", {
      method: "POST",
      body: JSON.stringify({ session_id }),
    }),

  endAllSessions: () =>
    req<{ ok: boolean }>("auth", "end_all_sessions", { method: "POST" }),

  deleteAccount: () =>
    req<{ ok: boolean }>("auth", "delete_account", { method: "POST" }),

  oauthUrl: (provider: "vk" | "mailru", redirect_uri: string) =>
    req<{ url: string; state: string; code_verifier?: string }>("auth", "oauth_url", {
      method: "POST",
      body: JSON.stringify({ provider, redirect_uri }),
    }),

  oauthCallback: async (
    provider: "vk" | "mailru",
    code: string,
    redirect_uri: string,
    extra?: { code_verifier?: string; device_id?: string },
  ) => {
    const data = await req<{ token: string; user: User }>("auth", "oauth_callback", {
      method: "POST",
      body: JSON.stringify({ provider, code, redirect_uri, ...(extra || {}) }),
    });
    setToken(data.token);
    cacheViewer(data.user);
    return data;
  },
};

// ─── Profiles ─────────────────────────────────────────────────────────────────
export interface DiscoverParams {
  age_min?: number;
  age_max?: number;
  looking_for?: string;
  search?: string;
  city?: string;
  country?: string;
  lat?: number;
  lon?: number;
  radius_km?: number;
  online_only?: boolean;
  new_only?: boolean;
  verified_only?: boolean;
  zodiac?: string;
}

export const profilesApi = {
  getDiscover: (params?: DiscoverParams) => {
    const p: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "" && v !== false) p[k] = String(v === true ? "1" : v);
      });
    }
    return req<{ profiles: Profile[] }>("profiles", "discover", {}, p);
  },

  updateMe: (data: Partial<Profile>) =>
    req<{ ok: boolean }>("profiles", "update_me", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateGeo: (lat: number, lon: number, country: string, city: string) =>
    req<{ ok: boolean }>("profiles", "update_geo", {
      method: "POST",
      body: JSON.stringify({ lat, lon, country, city }),
    }),

  uploadPhoto: (image: string, content_type: string) =>
    req<{ ok: boolean; photo_url: string }>("profiles", "upload_photo", {
      method: "POST",
      body: JSON.stringify({ image, content_type }),
    }),

  listProfilePhotos: () =>
    req<{ ok: boolean; photos: { id: number; photo_url: string; created_at: string }[] }>("profiles", "profile_photos_list", { method: "GET" }),

  getUserProfilePhotos: (user_id: number) =>
    req<{ ok: boolean; photos: { id: number; photo_url: string }[] }>("profiles", "user_profile_photos", { method: "GET" }, { user_id: String(user_id) }),

  addProfilePhoto: (image: string, content_type: string) =>
    req<{ ok: boolean; photo: { id: number; photo_url: string; created_at: string } }>("profiles", "profile_photo_add", {
      method: "POST",
      body: JSON.stringify({ image, content_type }),
    }),

  deleteProfilePhoto: (photo_id: number) =>
    req<{ ok: boolean }>("profiles", "profile_photo_delete", {
      method: "POST",
      body: JSON.stringify({ photo_id }),
    }),

  deleteCover: () =>
    req<{ ok: boolean }>("profiles", "delete_cover", { method: "POST" }),

  deletePhoto: () =>
    req<{ ok: boolean }>("profiles", "delete_photo", { method: "POST" }),

  activatePromo: (code: string) =>
    req<{ ok: boolean; discount_percent: number; code: string }>("profiles", "activate_promo", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  getFollowers: () =>
    req<{ ok: boolean; users: { id: number; name: string; age?: number; photo_url?: string; verified?: boolean; online?: boolean; last_seen?: string }[] }>("profiles", "my_followers", { method: "GET" }),

  getFollowing: () =>
    req<{ ok: boolean; users: { id: number; name: string; age?: number; photo_url?: string; verified?: boolean; online?: boolean; last_seen?: string }[] }>("profiles", "my_following", { method: "GET" }),

  getUserFollowers: (user_id: number) =>
    req<{ ok: boolean; users: { id: number; name: string; age?: number; photo_url?: string; verified?: boolean; online?: boolean; last_seen?: string }[] }>("profiles", "user_followers", { method: "GET" }, { user_id: String(user_id) }),

  subscribeToggle: (target_id: number) =>
    req<{ ok: boolean; subscribed: boolean }>("profiles", "subscribe_toggle", { method: "POST", body: JSON.stringify({ target_id }) }),

  subscriptionStatus: (target_id: number) =>
    req<{ subscribed: boolean }>("profiles", "subscription_status", { method: "GET" }, { target_id: String(target_id) }),

  uploadAudio: (audio: string, content_type: string) =>
    req<{ ok: boolean; url: string }>("profiles", "upload_audio", { method: "POST", body: JSON.stringify({ audio, content_type }) }),

  uploadVideoCircle: (video: string, content_type: string) =>
    req<{ ok: boolean; url: string }>("profiles", "upload_video_circle", { method: "POST", body: JSON.stringify({ video, content_type }) }),

  supportSend: (message: string) =>
    req<{ ok: boolean; ticket_id: number; created_at: string }>("profiles", "support_send", { method: "POST", body: JSON.stringify({ message }) }),

  supportMyTickets: () =>
    req<{ ok: boolean; tickets: { id: number; message: string; reply: string | null; status: string; created_at: string; replied_at: string | null }[] }>("profiles", "support_my_tickets"),

  supportDelete: (ticket_id: number) =>
    req<{ ok: boolean }>("profiles", "support_delete", { method: "POST", body: JSON.stringify({ ticket_id }) }),

  uploadCover: (image: string, content_type: string) =>
    req<{ ok: boolean; cover_url: string }>("profiles", "upload_cover", {
      method: "POST",
      body: JSON.stringify({ image, content_type }),
    }),

  listPrivatePhotos: () =>
    req<{ ok: boolean; photos: { id: number; photo_url: string; created_at: string }[] }>("profiles", "private_photos_list", { method: "GET" }),

  getPartnerPrivatePhotos: (partner_id: number) =>
    req<{ ok: boolean; photos: { id: number; photo_url: string }[] }>("profiles", "partner_private_photos", { method: "GET" }, { partner_id: String(partner_id) }),

  addPrivatePhoto: (image: string, content_type: string) =>
    req<{ ok: boolean; photo: { id: number; photo_url: string; created_at: string }; error?: string; limit?: number; premium?: boolean }>("profiles", "private_photo_add", {
      method: "POST",
      body: JSON.stringify({ image, content_type }),
    }),

  deletePrivatePhoto: (photo_id: number) =>
    req<{ ok: boolean }>("profiles", "private_photo_delete", {
      method: "POST",
      body: JSON.stringify({ photo_id }),
    }),

  myGifts: () =>
    req<{ ok: boolean; gifts: MyGift[] }>("profiles", "my_gifts", { method: "GET" }),

  userGifts: (user_id: number) =>
    req<{ ok: boolean; gifts: MyGift[] }>("profiles", "user_gifts", { method: "GET" }, { user_id: String(user_id) }),

  getIncognito: () =>
    req<{ incognito: boolean }>("profiles", "get_incognito", { method: "GET" }),

  toggleIncognito: () =>
    req<{ ok: boolean; incognito: boolean }>("profiles", "toggle_incognito", { method: "POST" }),
};

// ─── Verify ───────────────────────────────────────────────────────────────────
export interface VerifyStatus {
  verified: boolean;
  email: string | null;
  selfie_status: "pending" | "approved" | "rejected" | null;
  email_verified: boolean;
  reject_reason: string | null;
}

export const verifyApi = {
  getStatus: () => req<VerifyStatus>("profiles", "verify_status"),

  sendEmailCode: (email: string) =>
    req<{ ok: boolean }>("profiles", "verify_email_send", {
      method: "POST", body: JSON.stringify({ email }),
    }),

  confirmEmailCode: (email: string, code: string) =>
    req<{ ok: boolean }>("profiles", "verify_email_confirm", {
      method: "POST", body: JSON.stringify({ email, code }),
    }),

  uploadSelfie: (image: string, content_type: string) =>
    req<{ ok: boolean }>("profiles", "verify_selfie", {
      method: "POST", body: JSON.stringify({ image, content_type }),
    }),

  // Админ
  adminList: (adminToken: string) =>
    req<{ requests: AdminVerifyRequest[] }>("profiles", "admin_verify_list", {
      headers: { "X-Admin-Token": adminToken },
    }),

  adminApprove: (adminToken: string, request_id: number) =>
    req<{ ok: boolean }>("profiles", "admin_verify_approve", {
      method: "POST", body: JSON.stringify({ request_id }),
      headers: { "X-Admin-Token": adminToken },
    }),

  adminReject: (adminToken: string, request_id: number, reason: string) =>
    req<{ ok: boolean }>("profiles", "admin_verify_reject", {
      method: "POST", body: JSON.stringify({ request_id, reason }),
      headers: { "X-Admin-Token": adminToken },
    }),
};

export interface AdminVerifyRequest {
  id: number;
  user_id: number;
  selfie_url: string;
  status: string;
  email_verified: boolean;
  created_at: string;
  name: string;
  age?: number;
  photo_url?: string;
  reject_reason?: string;
}

// ─── Posts ────────────────────────────────────────────────────────────────────
export const postsApi = {
  getFeed: (offset = 0, limit = 30) =>
    req<{ posts: Post[]; has_more: boolean }>("profiles", "posts_feed", {}, {
      offset: String(offset),
      limit: String(limit),
    }),

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

  getUserProfile: (user_id: number) =>
    req<{ profile: Profile; posts: Post[] }>("profiles", "user_profile", {}, { user_id: String(user_id) }),

  deletePost: (post_id: number) =>
    req<{ ok: boolean }>("profiles", "post_delete", {
      method: "POST",
      body: JSON.stringify({ post_id }),
    }),

  editPost: (post_id: number, caption: string) =>
    req<{ ok: boolean }>("profiles", "post_edit", {
      method: "POST",
      body: JSON.stringify({ post_id, caption }),
    }),

  reportPost: (post_id: number, reason = "other") =>
    req<{ ok: boolean }>("profiles", "report_post", {
      method: "POST",
      body: JSON.stringify({ post_id, reason }),
    }),
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

// ─── Notifications ────────────────────────────────────────────────────────────
export interface Notification {
  type: "like" | "super_like" | "message" | "view" | "new_photo" | "subscription" | "match" | "verif_approved" | "verif_rejected" | "story_view" | "admin_report_resolved" | "admin_report_dismissed" | "admin_post_removed" | "admin_post_kept" | "premium_activated" | "admin_broadcast" | "admin_warning";
  from_user_id: number;
  name: string;
  photo_url?: string;
  text?: string;
  match_id?: number;
  ref_id?: number;
  created_at: string;
}

export const notificationsApi = {
  list: () => req<{ notifications: Notification[]; unread_count: number }>("notifications", "list"),
  unreadCount: () => req<{ unread_count: number; messages: number; likes: number }>("notifications", "unread_count"),
  markRead: () => req<{ ok: boolean }>("notifications", "mark_read", { method: "POST" }),
  trackView: (user_id: number) => req<{ ok: boolean }>("notifications", "track_view", { method: "POST", body: JSON.stringify({ user_id }) }),
  clearAll: () => req<{ ok: boolean }>("notifications", "clear_all", { method: "POST" }),
};

export const notifSettingsApi = {
  get: () => req<{ matches: boolean; messages: boolean; likes: boolean; promo: boolean }>("profiles", "get_notif_settings"),
  update: (settings: { matches?: boolean; messages?: boolean; likes?: boolean; promo?: boolean }) =>
    req<{ ok: boolean }>("profiles", "update_notif_settings", { method: "POST", body: JSON.stringify(settings) }),
};

// ─── Config ───────────────────────────────────────────────────────────────────
export const configApi = {
  yandexMapsKey: () => req<{ api_key: string }>("config", "yandex_maps_key"),
  oneSignalAppId: () => req<{ app_id: string }>("config", "onesignal_app_id"),
};

// ─── Push ─────────────────────────────────────────────────────────────────────
export const pushApi = {
  vapidPublicKey: () => req<{ public_key: string }>("push", "vapid_public_key"),
  subscribe: (sub: PushSubscriptionJSON) =>
    req<{ ok: boolean }>("push", "subscribe", { method: "POST", body: JSON.stringify(sub) }),
  test: () => req<{ ok: boolean }>("push", "test"),
};

// ─── Matches ─────────────────────────────────────────────────────────────────
export const matchesApi = {
  getAll: () => req<{ matches: Match[] }>("matches", "list"),
  delete: (match_id: number) => req<{ ok: boolean }>("matches", "delete", { method: "POST", body: JSON.stringify({ match_id }) }),
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

  sendDirect: (to_user_id: number, text: string) =>
    req<{ ok: boolean; match_id: number }>("messages", "send_direct", {
      method: "POST",
      body: JSON.stringify({ to_user_id, text }),
    }),

  delete: (message_id: number) =>
    req<{ ok: boolean; message_id: number }>("messages", "delete", {
      method: "POST",
      body: JSON.stringify({ message_id }),
    }),

  react: (message_id: number, reaction: string) =>
    req<{ ok: boolean; message_id: number; reaction: string | null }>("messages", "react", {
      method: "POST",
      body: JSON.stringify({ message_id, reaction }),
    }),

  uploadChatPhoto: (match_id: number, image: string, content_type: string) =>
    req<{ ok: boolean; photo_url: string }>("messages", "upload_chat_photo", {
      method: "POST",
      body: JSON.stringify({ match_id, image, content_type }),
    }),

  signalSend: (match_id: number, signal_type: string, payload: string) =>
    req<{ ok: boolean }>("messages", "signal_send", {
      method: "POST",
      body: JSON.stringify({ match_id, signal_type, payload }),
    }),

  signalPoll: (match_id: number) =>
    req<{ signals: { id: number; from_user_id: number; signal_type: string; payload: string }[] }>(
      "messages", "signal_poll", {}, { match_id: String(match_id) }
    ),

  // Глобальный поллинг входящих видеозвонков (на любой вкладке)
  incomingCall: () =>
    req<{ call: null | { match_id: number; from_user_id: number; offer: string; early_ice: string[]; caller_name: string; caller_photo: string } }>(
      "messages", "incoming_call"
    ),
};

// ─── Types ───────────────────────────────────────────────────────────────────
export interface MyGift {
  id: number;
  sender_id: number | null;
  gift_id: number;
  gift_name: string;
  gift_emoji: string;
  gift_category: string;
  gift_variant: number;
  gift_rarity: string;
  amount: number;
  created_at: string;
  sender_name?: string;
  sender_photo?: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  username?: string;
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
  premium_tier?: "start" | "plus" | "gold";
  height?: number;
  weight?: number;
  relationship_status?: string;
  created_at?: string;
  followers?: number;
  following?: number;
  cover_url?: string;
  email_verified?: boolean;
  show_age?: boolean;
  incognito?: boolean;
  zodiac?: string;
}

export interface Profile {
  id: number;
  name: string;
  age?: number;
  city?: string;
  bio?: string;
  photo_url?: string;
  cover_url?: string;
  tags?: string[];
  verified?: boolean;
  online?: boolean;
  last_seen?: string;
  premium?: boolean;
  premium_tier?: "start" | "plus" | "gold";
  height?: number;
  weight?: number;
  gender?: string;
  relationship_status?: string;
  show_age?: boolean;
  boosted?: boolean;
  username?: string;
  zodiac?: string;
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
  last_seen?: string;
  last_msg?: string;
  last_msg_time?: string;
  unread_count: number;
  is_bot?: boolean;
  verified?: boolean;
}

export interface Message {
  id: number;
  sender_id: number;
  text: string;
  created_at: string;
  out: boolean;
  read?: boolean;
  reaction?: string | null;
}

export interface Post {
  id: number;
  user_id: number;
  photo_url: string;
  caption?: string;
  created_at: string;
  author_name: string;
  author_photo?: string;
  author_zodiac?: string;
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

// ─── Admin ────────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  username?: string;
  age?: number;
  city?: string;
  verified: boolean;
  online: boolean;
  premium: boolean;
  created_at: string;
  banned: boolean;
}

export interface AdminMatch {
  id: number;
  created_at: string;
  user1_id: number;
  user1_name: string;
  user1_photo?: string;
  user1_age?: number;
  user2_id: number;
  user2_name: string;
  user2_photo?: string;
  user2_age?: number;
}

export interface AdminGift {
  id: number;
  created_at: string;
  amount: number;
  gift_name: string;
  gift_emoji: string;
  sender_id: number;
  sender_name: string;
  sender_photo?: string;
  receiver_id: number;
  receiver_name: string;
  receiver_photo?: string;
}

export interface AdminReport {
  id: number;
  reason: string;
  comment?: string;
  status: string;
  created_at: string;
  reporter_name: string;
  reporter_email: string;
  reported_name: string;
  reported_email: string;
  reported_id: number;
  post_id?: number;
  post_photo_url?: string;
}

export interface AdminVerifRequest {
  id: number;
  selfie_url: string;
  status: string;
  reject_reason?: string;
  created_at: string;
  user_id: number;
  name: string;
  age?: number;
  email: string;
  photo_url?: string;
  email_verified: boolean;
}

export interface AdminStats {
  total_users: number;
  online_users: number;
  new_today: number;
  new_week: number;
  new_month: number;
  total_likes: number;
  total_matches: number;
  total_messages: number;
  messages_today: number;
  active_sessions: number;
  verified_users: number;
  premium_users: number;
  total_gifts: number;
  open_tickets: number;
  pending_reports: number;
  pending_verif: number;
}

function adminReq<T>(action: string, options: RequestInit = {}, token: string, extraParams?: Record<string, string>): Promise<T> {
  const params = new URLSearchParams({ action, ...(extraParams || {}) });
  const url = `${URLS.admin}?${params.toString()}`;
  return fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token, ...(options.headers || {}) },
  }).then(async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
    return data as T;
  });
}

// ─── Blocks ──────────────────────────────────────────────────────────────────
export interface BlockedUser {
  id: number;
  name: string;
  photo_url?: string;
  age?: number;
  blocked_at: string;
}

export const blocksApi = {
  list: () => req<{ blocks: BlockedUser[] }>("profiles", "blocks_list"),
  block: (user_id: number) => req<{ ok: boolean }>("profiles", "block_user", { method: "POST", body: JSON.stringify({ user_id }) }),
  unblock: (user_id: number) => req<{ ok: boolean }>("profiles", "unblock_user", { method: "POST", body: JSON.stringify({ user_id }) }),
};

// ─── Video call blocks ────────────────────────────────────────────────────────
export const videoBlocksApi = {
  list: () => req<{ blocked_ids: number[] }>("profiles", "video_blocks_list"),
  block: (user_id: number) => req<{ ok: boolean }>("profiles", "video_block", { method: "POST", body: JSON.stringify({ user_id }) }),
  unblock: (user_id: number) => req<{ ok: boolean }>("profiles", "video_unblock", { method: "POST", body: JSON.stringify({ user_id }) }),
};

// ─── Subscriptions ────────────────────────────────────────────────────────────
export const subscriptionsApi = {
  toggle: (target_id: number) => req<{ ok: boolean; subscribed: boolean }>("profiles", "subscribe_toggle", { method: "POST", body: JSON.stringify({ target_id }) }),
  status: (target_id: number) => req<{ subscribed: boolean }>("profiles", "subscription_status", {}, { target_id: String(target_id) }),
};

// ─── Live ─────────────────────────────────────────────────────────────────────
export const liveApi = {
  list: () => req<{ streams: LiveStream[] }>("live", "list"),

  start: (title: string) =>
    req<{ stream: LiveStream }>("live", "start", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),

  end: () => req<{ ok: boolean }>("live", "end", { method: "POST" }),

  join: (stream_id: number) =>
    req<{ ok: boolean }>("live", "join", {
      method: "POST",
      body: JSON.stringify({ stream_id }),
    }),

  leave: (stream_id: number) =>
    req<{ ok: boolean }>("live", "leave", {
      method: "POST",
      body: JSON.stringify({ stream_id }),
    }),

  heart: (stream_id: number) =>
    req<{ hearts_count: number }>("live", "heart", {
      method: "POST",
      body: JSON.stringify({ stream_id }),
    }),

  chat: (stream_id: number, text: string) =>
    req<{ message: LiveMessage }>("live", "chat", {
      method: "POST",
      body: JSON.stringify({ stream_id, text }),
    }),

  checkFrame: (stream_id: number, image: string) =>
    req<{ ok: boolean; action: "ok" | "warn" | "blocked" | "skip"; reason?: string }>("live", "check_frame", {
      method: "POST",
      body: JSON.stringify({ stream_id, image }),
    }),

  poll: (stream_id: number, last_msg_id: number) =>
    req<{ stream: { id: number; status: string; viewers_count: number; hearts_count: number }; messages: LiveMessage[] }>(
      "live", "poll", {}, { stream_id: String(stream_id), last_msg_id: String(last_msg_id) }
    ),

  signalSend: (stream_id: number, signal_type: string, payload: string, to_user_id?: number) =>
    req<{ ok: boolean }>("live", "signal_send", {
      method: "POST",
      body: JSON.stringify({ stream_id, signal_type, payload, to_user_id }),
    }),

  signalPoll: (stream_id: number, last_id: number) =>
    req<{ signals: { id: number; from_user_id: number; to_user_id: number | null; signal_type: string; payload: string }[] }>(
      "live", "signal_poll", {}, { stream_id: String(stream_id), last_id: String(last_id) }
    ),

  leaderboard: (period: "live" | "today" | "week" | "all") =>
    req<{ entries: LeaderboardEntry[]; period: string }>(
      "live", "leaderboard", {}, { period }
    ),

  myStreams: () =>
    req<{ streams: MyStream[] }>("live", "my_streams"),

  clearMyStreams: () =>
    req<{ ok: boolean }>("live", "clear_my_streams", { method: "POST" }),
};

export interface LeaderboardEntry {
  user_id: number;
  name: string;
  photo_url?: string;
  premium: boolean;
  score: number;
  viewers: number;
  hearts: number;
  stream_id?: number | null;
}

export interface MyStream {
  id: number;
  title: string;
  status: string;
  viewers_count: number;
  hearts_count: number;
  started_at: string | null;
  ended_at: string | null;
  duration_sec: number | null;
}

// ─── Feedback ─────────────────────────────────────────────────────────────────
export const feedbackApi = {
  send: (text: string, rating?: number, category?: string) =>
    req<{ ok: boolean; id: number }>("feedback", "", {
      method: "POST",
      body: JSON.stringify({ text, rating, category: category || "general" }),
    }),
};

// ─── Support (обращение в поддержку) ──────────────────────────────────────────
export const supportApi = {
  send: (data: { name?: string; login?: string; email?: string; message: string; image?: string }) =>
    req<{ ok: boolean; id: number }>("support", "", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  stats: (token: string) => adminReq<AdminStats>('stats', {}, token),

  users: (token: string, page = 1, search = '') =>
    adminReq<{ users: AdminUser[]; total: number; page: number; per_page: number }>(
      'users', {}, token, { page: String(page), search }
    ),

  banUser: (token: string, user_id: number, reason: string) =>
    adminReq<{ ok: boolean }>('ban_user', { method: 'POST', body: JSON.stringify({ user_id, reason }) }, token),

  unbanUser: (token: string, user_id: number) =>
    adminReq<{ ok: boolean }>('unban_user', { method: 'POST', body: JSON.stringify({ user_id }) }, token),

  matchesList: (token: string, page = 1) =>
    adminReq<{ matches: AdminMatch[]; total: number; page: number; per_page: number }>(
      'matches_list', {}, token, { page: String(page) }
    ),

  giftsList: (token: string, page = 1) =>
    adminReq<{ gifts: AdminGift[]; total: number; page: number; per_page: number }>(
      'gifts_list', {}, token, { page: String(page) }
    ),

  reports: (token: string, status = 'pending') =>
    adminReq<{ reports: AdminReport[] }>('reports', {}, token, { status }),

  resolveReport: (token: string, report_id: number, status: string, ban_user = false, post_action = '') =>
    adminReq<{ ok: boolean }>('resolve_report', { method: 'POST', body: JSON.stringify({ report_id, status, ban_user, post_action }) }, token),

  verifRequests: (token: string) =>
    adminReq<{ requests: AdminVerifRequest[] }>('verif_requests', {}, token),

  verifApprove: (token: string, id: number) =>
    adminReq<{ ok: boolean }>('verif_approve', { method: 'POST', body: JSON.stringify({ id }) }, token),

  verifReject: (token: string, id: number, reason: string) =>
    adminReq<{ ok: boolean }>('verif_reject', { method: 'POST', body: JSON.stringify({ id, reason }) }, token),

  supportTickets: (token: string, status = 'open') =>
    adminReq<{ tickets: { id: number; user_id: number; message: string; reply: string | null; status: string; created_at: string; replied_at: string | null; user_name: string; user_photo: string | null }[] }>(
      'support_tickets', {}, token, { status }
    ),

  supportReply: (token: string, ticket_id: number, reply: string) =>
    adminReq<{ ok: boolean }>('support_reply', { method: 'POST', body: JSON.stringify({ ticket_id, reply }) }, token),

  editUser: (token: string, user_id: number, fields: Record<string, unknown>) =>
    adminReq<{ ok: boolean }>('edit_user', { method: 'POST', body: JSON.stringify({ user_id, ...fields }) }, token),

  userActivity: (token: string, user_id: number) =>
    adminReq<{ likes_sent: number; likes_received: number; matches: number; messages: number; reports_sent: number; reports_received: number; last_seen: string | null; created_at: string | null }>(
      'user_activity', {}, token, { user_id: String(user_id) }
    ),

  analyticsActivity: (token: string) =>
    adminReq<{ dau: { date: string; dau: number }[]; mau: { month: string; new_users: number }[] }>('analytics_activity', {}, token),

  analyticsDemo: (token: string) =>
    adminReq<{ gender: Record<string, number>; age: Record<string, number>; cities: { city: string; count: number }[] }>('analytics_demo', {}, token),

  analyticsFinance: (token: string) =>
    adminReq<{ total_gift_transactions: number; total_gift_revenue: number; premium_users: number; monthly: { month: string; count: number; revenue: number }[] }>('analytics_finance', {}, token),

  blockedIps: (token: string) =>
    adminReq<{ ips: { id: number; ip_address: string; reason: string; created_at: string }[] }>('blocked_ips', {}, token),
  blockIp: (token: string, ip_address: string, reason: string) =>
    adminReq<{ ok: boolean }>('block_ip', { method: 'POST', body: JSON.stringify({ ip_address, reason }) }, token),
  unblockIp: (token: string, id: number) =>
    adminReq<{ ok: boolean }>('unblock_ip', { method: 'POST', body: JSON.stringify({ id }) }, token),

  stopwords: (token: string) =>
    adminReq<{ words: { id: number; word: string; created_at: string }[] }>('stopwords', {}, token),
  addStopword: (token: string, word: string) =>
    adminReq<{ ok: boolean }>('add_stopword', { method: 'POST', body: JSON.stringify({ word }) }, token),
  deleteStopword: (token: string, id: number) =>
    adminReq<{ ok: boolean }>('delete_stopword', { method: 'POST', body: JSON.stringify({ id }) }, token),

  pushBroadcast: (token: string, title: string, message: string, segment: string) =>
    adminReq<{ ok: boolean; sent_to: number }>('push_broadcast', { method: 'POST', body: JSON.stringify({ title, message, segment }) }, token),

  oneSignalSend: (token: string, title: string, message: string, url: string) =>
    fetch(`${URLS.push}?action=onesignal_send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
      body: JSON.stringify({ title, body: message, url: url || '/' }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok || data.ok === false) throw new Error(data.error || 'Ошибка отправки OneSignal');
      return data as { ok: boolean; result?: { recipients?: number; id?: string } };
    }),

  oneSignalSendToUser: (token: string, user_id: number, title: string, message: string) =>
    fetch(`${URLS.push}?action=onesignal_test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
      body: JSON.stringify({ user_id, title, body: message }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok || data.ok === false) throw new Error(data.error || 'Ошибка отправки OneSignal');
      return data as { ok: boolean; result?: { recipients?: number } };
    }),

  banners: (token: string) =>
    adminReq<{ banners: { id: number; title: string; subtitle: string; color_from: string; color_to: string; active: boolean; created_at: string }[] }>('banners', {}, token),
  bannerSave: (token: string, data: Record<string, unknown>) =>
    adminReq<{ ok: boolean }>('banner_save', { method: 'POST', body: JSON.stringify(data) }, token),
  bannerDelete: (token: string, id: number) =>
    adminReq<{ ok: boolean }>('banner_delete', { method: 'POST', body: JSON.stringify({ id }) }, token),

  plans: (token: string) =>
    adminReq<{ plans: PremiumPlan[]; stats: Record<string, number>; total_premium: number }>('plans', {}, token),
  updatePlan: (token: string, id: number, fields: Partial<PremiumPlan>) =>
    adminReq<{ ok: boolean }>('update_plan', { method: 'POST', body: JSON.stringify({ id, ...fields }) }, token),
  createPlan: (token: string, fields: Omit<PremiumPlan, 'id' | 'updated_at'>) =>
    adminReq<{ ok: boolean; id: number }>('create_plan', { method: 'POST', body: JSON.stringify(fields) }, token),
  deletePlan: (token: string, id: number) =>
    adminReq<{ ok: boolean }>('delete_plan', { method: 'POST', body: JSON.stringify({ id }) }, token),

  contentPosts: (token: string, page = 1) =>
    adminReq<{ posts: AdminContentPost[]; total: number; page: number }>('content_posts', {}, token, { page: String(page) }),

  contentPhotos: (token: string, page = 1) =>
    adminReq<{ photos: AdminContentPhoto[]; page: number }>('content_photos', {}, token, { page: String(page) }),

  deletePost: (token: string, post_id: number) =>
    adminReq<{ ok: boolean }>('delete_post', { method: 'POST', body: JSON.stringify({ post_id }) }, token),

  deleteProfilePhoto: (token: string, user_id: number, photo_url: string, photo_type: string) =>
    adminReq<{ ok: boolean }>('delete_profile_photo', { method: 'POST', body: JSON.stringify({ user_id, photo_url, photo_type }) }, token),

  sendWarning: (token: string, user_id: number, text: string) =>
    adminReq<{ ok: boolean }>('send_warning', { method: 'POST', body: JSON.stringify({ user_id, text }) }, token),
};

export interface AdminContentPost {
  id: number;
  user_id: number;
  photo_url: string;
  caption?: string;
  created_at: string;
  user_name: string;
  username?: string;
  user_photo?: string;
}

export interface AdminContentPhoto {
  type: 'cover' | 'gallery';
  user_id: number;
  photo_url: string;
  user_name: string;
  username?: string;
  user_photo?: string;
  created_at: string;
}

export interface PremiumPlan {
  id: number;
  plan_key: string;
  label: string;
  price_per_month: number;
  total_amount: number;
  duration_months: number;
  popular: boolean;
  active: boolean;
  sort_order: number;
  updated_at?: string;
}

export const postsApi2 = {
  getPremiumPlans: (tier?: "start" | "plus" | "gold") =>
    req<{ plans: { plan: string; label: string; price_per_month: number; total_amount: number; duration_months: number; popular: boolean }[] }>(
      'profiles', 'get_premium_plans', {}, tier ? { tier } : {}
    ),
};

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_days: number;
  active_today: boolean;
  streak_frozen: boolean;
  next_milestone: number | null;
  reached_milestone: boolean;
  milestones: number[];
}

export const streaksApi = {
  get: () => {
    const token = getToken();
    return fetch(URLS.streaks, {
      headers: { "X-Auth-Token": token },
    }).then(r => r.json()) as Promise<StreakData>;
  },
  getUser: (userId: number) => {
    const token = getToken();
    return fetch(`${URLS.streaks}?user_id=${userId}`, {
      headers: { "X-Auth-Token": token },
    }).then(r => r.json()) as Promise<StreakData>;
  },
  checkin: () => {
    const token = getToken();
    return fetch(URLS.streaks, {
      method: "POST",
      headers: { "X-Auth-Token": token, "Content-Type": "application/json" },
    }).then(r => r.json()) as Promise<StreakData>;
  },
};

export interface CompatQuestion {
  idx: number;
  text: string;
  options: string[];
  creator_answer: number | null;
  partner_answer: number | null;
}

export interface CompatGame {
  id: number;
  match_id: number;
  created_by: number;
  partner_id: number;
  status: "waiting" | "answering" | "finished";
  score_creator: number | null;
  score_partner: number | null;
  finished_at: string | null;
  is_creator: boolean;
  my_answered: boolean;
}

export const compatibilityApi = {
  create: (match_id: number, partner_id: number) => {
    const token = getToken();
    return fetch(`${URLS.compatibility}?action=create`, {
      method: "POST",
      headers: { "X-Auth-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify({ match_id, partner_id }),
    }).then(r => r.json()) as Promise<{ game_id: number; already_exists?: boolean }>;
  },
  get: (match_id: number) => {
    const token = getToken();
    return fetch(`${URLS.compatibility}?action=get&match_id=${match_id}`, {
      headers: { "X-Auth-Token": token },
    }).then(r => r.json()) as Promise<{ game: CompatGame | null; questions: CompatQuestion[] }>;
  },
  getById: (game_id: number) => {
    const token = getToken();
    return fetch(`${URLS.compatibility}?action=get&game_id=${game_id}`, {
      headers: { "X-Auth-Token": token },
    }).then(r => r.json()) as Promise<{ game: CompatGame | null; questions: CompatQuestion[] }>;
  },
  answer: (game_id: number, answers: Record<number, number>) => {
    const token = getToken();
    return fetch(`${URLS.compatibility}?action=answer`, {
      method: "POST",
      headers: { "X-Auth-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify({ game_id, answers }),
    }).then(r => r.json()) as Promise<{ ok: boolean; finished: boolean }>;
  },
};