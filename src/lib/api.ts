const URLS = {
  auth: "https://functions.poehali.dev/afecc843-8ea5-4c3e-b8ea-4417ed223311",
  profiles: "https://functions.poehali.dev/4f3f0bdc-dd8e-4bc7-a463-a3d36b67fd38",
  likes: "https://functions.poehali.dev/c37e7b16-25a5-4fad-b27b-cd0dd5825909",
  matches: "https://functions.poehali.dev/ae9c2fc5-07a8-415c-9bf6-9318d8101a4d",
  messages: "https://functions.poehali.dev/dc1a6137-a066-4ec4-8081-52ac7b0b1530",
  admin: "https://functions.poehali.dev/a87188e5-57d7-4ad4-ac31-0a2c3e3d0e18",
  notifications: "https://functions.poehali.dev/5249d7a9-31e2-4ab5-a2da-6b72346e5de4",
  push: "https://functions.poehali.dev/282c24e0-ca25-4712-ad58-26c7742c2653",
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

  getFollowers: () =>
    req<{ ok: boolean; users: { id: number; name: string; age?: number; photo_url?: string; verified?: boolean; online?: boolean }[] }>("profiles", "my_followers", { method: "GET" }),

  getFollowing: () =>
    req<{ ok: boolean; users: { id: number; name: string; age?: number; photo_url?: string; verified?: boolean; online?: boolean }[] }>("profiles", "my_following", { method: "GET" }),

  getUserFollowers: (user_id: number) =>
    req<{ ok: boolean; users: { id: number; name: string; age?: number; photo_url?: string; verified?: boolean; online?: boolean }[] }>("profiles", "user_followers", { method: "GET" }, { user_id: String(user_id) }),

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

  getUserProfile: (user_id: number) =>
    req<{ profile: Profile; posts: Post[] }>("profiles", "user_profile", {}, { user_id: String(user_id) }),

  deletePost: (post_id: number) =>
    req<{ ok: boolean }>("profiles", "post_delete", {
      method: "POST",
      body: JSON.stringify({ post_id }),
    }),

  reportPost: (post_id: number, reason = "other") =>
    req<{ ok: boolean }>("profiles", "report_post", {
      method: "POST",
      body: JSON.stringify({ post_id, reason }),
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

// ─── Notifications ────────────────────────────────────────────────────────────
export interface Notification {
  type: "like" | "super_like" | "message" | "view" | "new_photo" | "subscription" | "match" | "verif_approved" | "verif_rejected";
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
  height?: number;
  weight?: number;
  relationship_status?: string;
  created_at?: string;
  followers?: number;
  following?: number;
  cover_url?: string;
  email_verified?: boolean;
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
  last_seen?: string;
  premium?: boolean;
  height?: number;
  weight?: number;
  relationship_status?: string;
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

  reports: (token: string, status = 'pending') =>
    adminReq<{ reports: AdminReport[] }>('reports', {}, token, { status }),

  resolveReport: (token: string, report_id: number, status: string, ban_user = false) =>
    adminReq<{ ok: boolean }>('resolve_report', { method: 'POST', body: JSON.stringify({ report_id, status, ban_user }) }, token),

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
};