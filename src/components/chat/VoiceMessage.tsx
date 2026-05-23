import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  url: string;
  out: boolean;
}

const BARS = 32;

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function generateWaveform(seed: string): number[] {
  // Псевдослучайные высоты на основе url — стабильны для одного сообщения
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < BARS; i++) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const v = (hash & 0xffff) / 0xffff;
    // больше "горбов" в середине
    const middleBoost = 1 - Math.abs(i - BARS / 2) / (BARS / 2);
    out.push(0.25 + v * 0.55 + middleBoost * 0.2);
  }
  return out;
}

export default function VoiceMessage({ url, out }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);
  const [played, setPlayed] = useState(false);
  const bars = useRef(generateWaveform(url));

  useEffect(() => {
    const a = new Audio(url);
    a.preload = "metadata";
    audioRef.current = a;

    const onMeta = () => { setDuration(a.duration); setLoaded(true); };
    const onTime = () => setCurrent(a.currentTime);
    const onEnd = () => { setPlaying(false); setCurrent(0); a.currentTime = 0; };

    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("durationchange", onMeta);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);

    return () => {
      a.pause();
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("durationchange", onMeta);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
      audioRef.current = null;
    };
  }, [url]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.playbackRate = speed;
      a.play().then(() => { setPlaying(true); setPlayed(true); }).catch(() => {});
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * duration;
    setCurrent(a.currentTime);
  };

  const changeSpeed = () => {
    const next: 1 | 1.5 | 2 = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const progress = duration ? current / duration : 0;
  const shownTime = playing || current > 0 ? current : duration;

  // Цвета для исходящих и входящих
  const playBg = out
    ? "linear-gradient(135deg,#FF2D78,#9B59B6)"
    : "linear-gradient(135deg,#FF2D78,#9B59B6)";
  const playedColor = out ? "#FFFFFF" : "#FF2D78";
  const unplayedColor = out ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.28)";

  return (
    <div className="flex items-center gap-2.5 px-1 py-1" style={{ minWidth: 220, maxWidth: 260 }}>
      {/* Кнопка Play/Pause */}
      <button
        onClick={toggle}
        disabled={!loaded}
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform disabled:opacity-50"
        style={{ background: playBg, boxShadow: "0 4px 12px rgba(255,45,120,0.35)" }}>
        {!loaded ? (
          <Icon name="Loader2" size={16} className="text-white animate-spin" />
        ) : (
          <Icon name={playing ? "Pause" : "Play"} size={16} className="text-white" />
        )}
      </button>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        {/* Waveform */}
        <div
          className="relative h-7 flex items-center gap-[2px] cursor-pointer"
          onClick={seek}>
          {bars.current.map((h, i) => {
            const barProgress = (i + 1) / BARS;
            const active = barProgress <= progress;
            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-colors"
                style={{
                  height: `${Math.max(15, h * 100)}%`,
                  background: active ? playedColor : unplayedColor,
                  minWidth: 2,
                }}
              />
            );
          })}
        </div>

        {/* Низ: время + микро-иконка + скорость */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Icon name="Mic" size={10} className={out ? "text-white/70" : "text-pink-400"} />
            <span className={`text-[11px] font-mono ${out ? "text-white/80" : "text-white/70"}`}>
              {formatTime(shownTime)}
            </span>
            {!played && !out && (
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
            )}
          </div>
          {(playing || current > 0) && (
            <button onClick={changeSpeed}
              className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white/80"
              style={{ background: "rgba(255,255,255,0.15)" }}>
              {speed}x
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
