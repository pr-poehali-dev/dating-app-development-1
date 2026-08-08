export type CallState = "calling" | "incoming" | "connected" | "ended";

export interface VideoCallProps {
  matchId: number;
  partnerName: string;
  partnerPhoto: string;
  isInitiator: boolean;
  initialOffer?: string;
  earlyIce?: string[];
  onClose: () => void;
}

export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    {
      urls: [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
        "turn:openrelay.metered.ca:443?transport=tcp",
      ],
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};

/**
 * Серверы связи, полученные с бэкенда (могут содержать платный TURN).
 * Кэшируются на время сессии — запрашиваются один раз.
 */
let cachedIce: RTCConfiguration | null = null;
let icePromise: Promise<RTCConfiguration> | null = null;

export function getIceServers(): Promise<RTCConfiguration> {
  if (cachedIce) return Promise.resolve(cachedIce);
  if (icePromise) return icePromise;
  icePromise = import("@/lib/api")
    .then(({ configApi }) => configApi.iceServers())
    .then(r => {
      const cfg: RTCConfiguration = {
        iceServers: (r.ice_servers as RTCIceServer[]) || ICE_SERVERS.iceServers,
        iceCandidatePoolSize: 10,
      };
      cachedIce = cfg;
      return cfg;
    })
    .catch(() => ICE_SERVERS);
  return icePromise;
}

/** Прогреваем список серверов заранее, чтобы звонок стартовал без задержки. */
export function prefetchIceServers() {
  getIceServers().catch(() => {});
}

export const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: { ideal: true },
  noiseSuppression: { ideal: true },
  autoGainControl: { ideal: true },
  channelCount: { ideal: 1 },
  sampleRate: { ideal: 48000 },
  // @ts-expect-error — нестандартные, но поддерживаемые браузерами параметры подавления эха
  latency: { ideal: 0.01 },
  googEchoCancellation: true,
  googEchoCancellation2: true,
  googAutoGainControl: true,
  googNoiseSuppression: true,
  googNoiseSuppression2: true,
  googHighpassFilter: true,
  googTypingNoiseDetection: true,
  googAudioMirroring: false,
};

/**
 * Профиль качества видео. Подбирается под тип сети:
 * на Wi-Fi/4G — честные 720p, на слабом мобильном — ниже, чтобы не было фризов.
 */
export interface VideoProfile {
  width: number;
  height: number;
  frameRate: number;
  /** Стартовый потолок битрейта, бит/с */
  maxBitrate: number;
  /** Нижняя граница, ниже которой автоподстройка не опускается */
  minBitrate: number;
}

type NetInfo = { effectiveType?: string; downlink?: number; saveData?: boolean };

function netInfo(): NetInfo {
  const n = navigator as unknown as { connection?: NetInfo; mozConnection?: NetInfo; webkitConnection?: NetInfo };
  return n.connection || n.mozConnection || n.webkitConnection || {};
}

/** HD 720p — целевое качество звонка. */
export const HD_PROFILE: VideoProfile = {
  width: 1280, height: 720, frameRate: 30,
  maxBitrate: 2_200_000, minBitrate: 500_000,
};

/** Средний профиль для нестабильной мобильной сети. */
export const SD_PROFILE: VideoProfile = {
  width: 960, height: 540, frameRate: 25,
  maxBitrate: 1_200_000, minBitrate: 350_000,
};

/** Экономный профиль — очень слабый интернет или режим экономии трафика. */
export const LOW_PROFILE: VideoProfile = {
  width: 640, height: 360, frameRate: 20,
  maxBitrate: 600_000, minBitrate: 200_000,
};

/** Выбирает профиль качества по текущему состоянию сети. */
export function pickVideoProfile(): VideoProfile {
  const { effectiveType, downlink, saveData } = netInfo();
  if (saveData) return LOW_PROFILE;
  if (effectiveType === "slow-2g" || effectiveType === "2g") return LOW_PROFILE;
  if (effectiveType === "3g") return SD_PROFILE;
  // downlink в Мбит/с — если сеть заведомо узкая, не насилуем её HD
  if (typeof downlink === "number" && downlink > 0 && downlink < 1.2) return LOW_PROFILE;
  if (typeof downlink === "number" && downlink > 0 && downlink < 2.5) return SD_PROFILE;
  return HD_PROFILE;
}

/** Ограничения камеры под выбранный профиль. */
export function videoConstraintsFor(p: VideoProfile, facingMode: "user" | "environment"): MediaTrackConstraints {
  return {
    width: { ideal: p.width, max: 1280 },
    height: { ideal: p.height, max: 720 },
    frameRate: { ideal: p.frameRate, max: 30 },
    facingMode,
  };
}

export const formatDuration = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};