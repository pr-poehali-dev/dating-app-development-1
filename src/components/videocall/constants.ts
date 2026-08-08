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

export const formatDuration = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};