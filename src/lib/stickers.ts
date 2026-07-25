import { useState, useEffect, useCallback } from "react";

export interface Sticker {
  url: string;
  label: string;
}

export interface StickerPack {
  id: string;
  title: string;
  stickers: Sticker[];
}

const CDN = "https://cdn.poehali.dev/projects/9df03ca1-fcdc-457e-ab68-903e1fac923d/files";

// ─── Наборы стикеров ──────────────────────────────────────────────────────────
export const STICKER_PACKS: StickerPack[] = [
  {
    id: "anime",
    title: "Аниме",
    stickers: [
      { url: `${CDN}/67b035e6-7f16-4d34-9d88-ab0ed2e18b43.jpg`, label: "Любовь" },
      { url: `${CDN}/a7091a63-e89b-4f2b-bbec-891f462322f8.jpg`, label: "Смущение" },
      { url: `${CDN}/9e5ae811-669b-49ee-837a-9e6bc293bc18.jpg`, label: "Радость" },
      { url: `${CDN}/4b23033d-7bdd-4f95-8eff-917be9a87a01.jpg`, label: "Злость" },
      { url: `${CDN}/975d66a4-d787-4915-b2d5-7444020b1339.jpg`, label: "Круто" },
      { url: `${CDN}/e82df3f1-2efc-47ff-9996-5c2338b77655.jpg`, label: "Сонный" },
      { url: `${CDN}/ff7ea746-566e-403e-b50a-82103b7920f2.jpg`, label: "Восторг" },
      { url: `${CDN}/82cfc3f0-6d3b-4304-975c-bad64f3a8249.jpg`, label: "Грусть" },
      { url: `${CDN}/9d36609f-b83e-40cd-a0d3-540b68150758.jpg`, label: "Флирт" },
      { url: `${CDN}/76c8840e-f484-426e-b7db-69c2877a5b97.jpg`, label: "Вместе" },
    ],
  },
  {
    id: "bear",
    title: "Мишка",
    stickers: [
      { url: `${CDN}/c8ea0009-ef5c-44e7-8b71-aa938c69c049.jpg`, label: "Поцелуй" },
      { url: `${CDN}/afd9b152-d415-4a6b-8829-442ddc11c5f6.jpg`, label: "Обнимашки" },
      { url: `${CDN}/b5a34aaa-13e7-4ca9-90fb-188887228e8c.jpg`, label: "Плачу" },
      { url: `${CDN}/e1f46808-1ad3-48e7-80f6-56d45a6970f5.jpg`, label: "Класс" },
    ],
  },
  {
    id: "cat",
    title: "Котик",
    stickers: [
      { url: `${CDN}/ba93774c-42aa-40f4-afa2-3edd4104f486.jpg`, label: "Подмигивание" },
      { url: `${CDN}/29e65571-48d0-4b57-88bf-45f4ec848fae.jpg`, label: "Любовь" },
      { url: `${CDN}/60852a75-ce32-4d5f-9d0b-ca5b70833022.jpg`, label: "Обида" },
      { url: `${CDN}/403a8caa-17f6-40c4-a7ed-13588a500466.jpg`, label: "Сон" },
    ],
  },
];

export const STICKER_PREFIX = "__STICKER__";

// ─── Эмодзи ───────────────────────────────────────────────────────────────────
export const EMOJI_ROWS: string[][] = [
  ["😍", "🥰", "❤️", "🔥", "😘", "💋", "🫦", "💕"],
  ["😂", "🤣", "😭", "🥺", "😅", "🙈", "😏", "🤤"],
  ["👋", "🤙", "💪", "🙏", "👅", "💦", "🥵", "🫠"],
  ["🎉", "🏆", "💎", "🌹", "🍓", "🦋", "✨", "💯"],
];

// ─── Настройки стикеров/эмодзи (localStorage) ────────────────────────────────
export interface StickerSettings {
  largeEmoji: boolean;   // Крупные эмодзи
  recentFirst: boolean;  // Сначала недавно использованные наборы
  enabledPacks: string[]; // id включённых наборов
  quickReaction: boolean; // Двойной тап по сообщению ставит реакцию
  quickReactionEmoji: string; // Эмодзи быстрой реакции
}

const SETTINGS_KEY = "sticker_settings_v1";
const RECENT_KEY = "sticker_recent_v1";

const DEFAULT_SETTINGS: StickerSettings = {
  largeEmoji: true,
  recentFirst: true,
  enabledPacks: STICKER_PACKS.map(p => p.id),
  quickReaction: true,
  quickReactionEmoji: "❤️",
};

function readSettings(): StickerSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<StickerSettings>;
    return {
      largeEmoji: parsed.largeEmoji ?? DEFAULT_SETTINGS.largeEmoji,
      recentFirst: parsed.recentFirst ?? DEFAULT_SETTINGS.recentFirst,
      enabledPacks: Array.isArray(parsed.enabledPacks) ? parsed.enabledPacks : DEFAULT_SETTINGS.enabledPacks,
      quickReaction: parsed.quickReaction ?? DEFAULT_SETTINGS.quickReaction,
      quickReactionEmoji: parsed.quickReactionEmoji ?? DEFAULT_SETTINGS.quickReactionEmoji,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Быстрая реакция включена? (двойной тап по сообщению) */
export function isQuickReactionOn(): boolean {
  return readSettings().quickReaction;
}

/** Эмодзи быстрой реакции. */
export function getQuickReactionEmoji(): string {
  return readSettings().quickReactionEmoji;
}

/** Хук настроек стикеров и эмодзи. */
export function useStickerSettings() {
  const [settings, setSettings] = useState<StickerSettings>(readSettings);

  const update = useCallback((patch: Partial<StickerSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const togglePack = useCallback((id: string) => {
    setSettings(prev => {
      const on = prev.enabledPacks.includes(id);
      const enabledPacks = on ? prev.enabledPacks.filter(p => p !== id) : [...prev.enabledPacks, id];
      const next = { ...prev, enabledPacks };
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Синхронизация между экранами в рамках одной вкладки
  useEffect(() => {
    const onStorage = () => setSettings(readSettings());
    window.addEventListener("sticker-settings-changed", onStorage);
    return () => window.removeEventListener("sticker-settings-changed", onStorage);
  }, []);

  return { settings, update, togglePack };
}

// ─── Недавно использованные наборы ────────────────────────────────────────────
export function getRecentPackIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function markPackUsed(packId: string) {
  try {
    const prev = getRecentPackIds().filter(id => id !== packId);
    localStorage.setItem(RECENT_KEY, JSON.stringify([packId, ...prev].slice(0, 10)));
  } catch { /* ignore */ }
}

/** Возвращает наборы к показу в чате: только включённые, с учётом «сначала недавние». */
export function getVisiblePacks(settings: StickerSettings): StickerPack[] {
  const enabled = STICKER_PACKS.filter(p => settings.enabledPacks.includes(p.id));
  if (!settings.recentFirst) return enabled;
  const recent = getRecentPackIds();
  return [...enabled].sort((a, b) => {
    const ia = recent.indexOf(a.id);
    const ib = recent.indexOf(b.id);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}